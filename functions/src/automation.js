const functions = require("firebase-functions");
const admin = require("firebase-admin");
const path = require("path");
const os = require("os");
const fs = require("fs");
const cors = require("cors")({ origin: true });
const Busboy = require("busboy");
const ical = require("node-ical");
const db = admin.firestore();

// --- REUSABLE AUTOMATION FUNCTION ---
const triggerAutomationForBooking = async (bookingDetails) => {
    const { propertyId, checkoutDate, guestName } = bookingDetails;
    functions.logger.log(`Triggering automation for propertyId: ${propertyId}`);

    if (!propertyId || !checkoutDate) {
        functions.logger.error("Automation trigger failed: Missing propertyId or checkoutDate.");
        return;
    }

    const propertyRef = db.collection('properties').doc(propertyId);
    const rulesRef = db.collection('automationRules').doc(propertyId);

    const [propertyDoc, rulesDoc] = await Promise.all([propertyRef.get(), rulesRef.get()]);

    if (!propertyDoc.exists) {
        functions.logger.error(`Automation trigger failed: Property with ID ${propertyId} not found.`);
        return;
    }
    if (!rulesDoc.exists || !rulesDoc.data().rules) {
        functions.logger.info(`No automation rules found for property ${propertyId}. No tasks created.`);
        return;
    }

    const propertyData = propertyDoc.data();
    const rules = rulesDoc.data().rules;
    const tasksToCreate = [];
    const notificationsToSend = [];

    for (const rule of rules) {
        const coDate = new Date(checkoutDate);
        const dueDate = new Date(coDate.setDate(coDate.getDate() + (rule.timeline?.daysAfterCheckout || 0)));
        const formattedDueDate = dueDate.toISOString().split('T')[0];

        const taskData = {
            taskName: `${rule.ruleName} for ${guestName || propertyData.propertyName}`,
            taskType: rule.taskType || 'Cleaning',
            description: `Automated task generated for checkout on ${checkoutDate}.`,
            priority: 'Medium',
            status: 'Pending Assignment',
            assignmentStatus: 'PendingPrimary',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            propertyId: propertyId,
            propertyName: propertyData.propertyName,
            ownerId: propertyData.ownerId,
            scheduledDate: formattedDueDate,
            primaryAssignee: rule.defaultAssignee || '',
            fallbackAssignee: rule.fallbackAssignee || '',
            assignedTo: '',
            assignedToEmail: '',
            rejectionCount: 0,
            checklistTemplateId: rule.checklistTemplateId || '',
            checklistItems: [],
        };

        const taskCreationPromise = db.collection('tasks').add(taskData).then(docRef => {
            if (taskData.primaryAssignee) {
                const notification = {
                    userId: taskData.primaryAssignee,
                    taskId: docRef.id,
                    type: "NEW_TASK_OFFER",
                    message: `You have a new task offer: "${taskData.taskName}" for property "${taskData.propertyName}".`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    isRead: false,
                };
                notificationsToSend.push(db.collection('notifications').add(notification));
            }
        });

        tasksToCreate.push(taskCreationPromise);
    }

    await Promise.all(tasksToCreate);
    await Promise.all(notificationsToSend);
    functions.logger.log(`Automation successful: Created ${tasksToCreate.length} tasks and sent notifications for property ${propertyId}.`);
};

// --- HELPER FUNCTION FOR DOUBLE BOOKING DETECTION ---
const checkForDoubleBooking = async (newBooking, existingBookingId = null) => {
    functions.logger.log(`Checking for double bookings for property: ${newBooking.propertyId}`);

    const bookingsRef = db.collection('bookings');
    const q = bookingsRef
        .where('propertyId', '==', newBooking.propertyId)
        .where('endDate', '>', newBooking.startDate);

    const snapshot = await q.get();

    if (snapshot.empty) {
        functions.logger.log("No potential conflicts found.");
        return;
    }

    const conflictingBookings = [];
    snapshot.forEach(doc => {
        if (doc.id === existingBookingId) {
            return;
        }
        const booking = doc.data();
        if (booking.startDate < newBooking.endDate) {
            conflictingBookings.push({ id: doc.id, ...booking });
        }
    });

    if (conflictingBookings.length > 0) {
        functions.logger.warn(`Conflict detected! New booking overlaps with ${conflictingBookings.length} other booking(s).`);
        const conflictingGuest = conflictingBookings[0].guestName;

        const notification = {
            ownerId: newBooking.ownerId,
            propertyId: newBooking.propertyId,
            type: "DOUBLE_BOOKING",
            message: `Double booking detected at ${newBooking.propertyName} for guest "${newBooking.guestName}". It conflicts with the booking for "${conflictingGuest}".`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
            conflictingBookingIds: [existingBookingId, ...conflictingBookings.map(b => b.id)].filter(Boolean)
        };

        await db.collection('notifications').add(notification);
    }
};

// --- EXPORTED FUNCTIONS ---

exports.uploadProof = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        if (req.method !== "POST") {
            return res.status(405).send({ error: "Method Not Allowed" });
        }

        try {
            const busboy = Busboy({ headers: req.headers });
            const tmpdir = os.tmpdir();
            const fields = {};
            const uploads = {};
            const fileWrites = [];

            busboy.on("field", (fieldname, val) => {
                fields[fieldname] = val;
            });

            busboy.on("file", (fieldname, file, info) => {
                const { filename, mimeType } = info;
                const filepath = path.join(tmpdir, filename);
                uploads[fieldname] = { filepath, mimeType };
                const writeStream = fs.createWriteStream(filepath);
                file.pipe(writeStream);

                const promise = new Promise((resolve, reject) => {
                    file.on("end", () => { writeStream.end(); });
                    writeStream.on("finish", resolve);
                    writeStream.on("error", reject);
                });
                fileWrites.push(promise);
            });

            busboy.on("finish", async () => {
                try {
                    await Promise.all(fileWrites);

                    const fileData = uploads.file;
                    if (!fileData) throw new Error("File data is missing.");
                    
                    const { taskId, itemIndex, originalFilename } = fields;
                    if (!taskId || !itemIndex || !originalFilename) throw new Error("Required fields missing.");

                    const bucket = admin.storage().bucket();
                    const destination = `proofs/${taskId}/${itemIndex}-${originalFilename}`;
                    
                    await bucket.upload(fileData.filepath, { destination, metadata: { contentType: fileData.mimeType } });
                    fs.unlinkSync(fileData.filepath);

                    const file = bucket.file(destination);
                    const [url] = await file.getSignedUrl({ action: "read", expires: "03-09-2491" });

                    const taskRef = db.collection('tasks').doc(taskId);
                    const taskDoc = await taskRef.get();
                    if (taskDoc.exists) {
                        const taskData = taskDoc.data();
                        const checklistItems = taskData.checklistItems || [];
                        if (checklistItems[itemIndex]) {
                            checklistItems[itemIndex].photoURL = url;
                            await taskRef.update({ checklistItems });
                        }
                    }

                    return res.status(200).send({ proofURL: url });
                } catch (error) {
                    functions.logger.error("Error in 'finish' handler:", error);
                    return res.status(500).send({ error: "Processing failed on server." });
                }
            });
            busboy.end(req.rawBody);
        } catch (error) {
            functions.logger.error("Critical error in function execution:", error);
            return res.status(500).send({ error: "Function execution failed." });
        }
    });
});

exports.onBookingReceived = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send({ error: "Method Not Allowed" });
        }
        try {
            await triggerAutomationForBooking(req.body);
            return res.status(200).send({ status: "success", message: "Automation triggered." });
        } catch (error) {
            functions.logger.error("Error in onBookingReceived:", error);
            return res.status(500).send({ status: "error", message: "Internal server error." });
        }
    });
});

exports.syncIcalFeeds = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    const propertiesSnapshot = await db.collection('properties').get();
    if (propertiesSnapshot.empty) return null;

    for (const doc of propertiesSnapshot.docs) {
        const property = doc.data();
        if (property.iCalUrl) {
            try {
                const data = await ical.fromURL(property.iCalUrl);
                for (const k in data) {
                    if (data[k].type === 'VEVENT') {
                        const event = data[k];
                        const bookingId = event.uid.split('@')[0];
                        const bookingData = {
                            propertyId: doc.id,
                            propertyName: property.propertyName,
                            ownerId: property.ownerId,
                            guestName: event.summary || 'Booked',
                            startDate: event.start.toISOString().split('T')[0],
                            endDate: event.end.toISOString().split('T')[0],
                            syncedAt: admin.firestore.FieldValue.serverTimestamp()
                        };
                        await checkForDoubleBooking(bookingData, bookingId);
                        await db.collection('bookings').doc(bookingId).set(bookingData, { merge: true });
                    }
                }
            } catch (err) {
                functions.logger.error(`Error processing iCal for property ${doc.id}:`, err);
            }
        }
    }
    return null;
});

exports.addManualBooking = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send({ error: "Method Not Allowed" });
        }
        try {
            const { propertyId, startDate, endDate, guestName } = req.body;
            if (!propertyId || !startDate || !endDate || !guestName) {
                return res.status(400).send({ error: "Missing required fields." });
            }

            const propertyDoc = await db.collection('properties').doc(propertyId).get();
            if (!propertyDoc.exists) {
                return res.status(404).send({ error: "Property not found." });
            }

            const propertyData = propertyDoc.data();
            const bookingId = `manual_${Date.now()}`;
            const newBooking = {
                propertyId,
                propertyName: propertyData.propertyName,
                ownerId: propertyData.ownerId,
                guestName,
                startDate,
                endDate,
                syncedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await checkForDoubleBooking(newBooking, bookingId);
            await db.collection('bookings').doc(bookingId).set(newBooking);
            await triggerAutomationForBooking({ propertyId, checkoutDate: endDate, guestName });

            return res.status(200).send({ status: "success", bookingId });
        } catch (error) {
            functions.logger.error("Error creating manual booking:", error);
            return res.status(500).send({ status: "error", message: "Internal server error." });
        }
    });
});