// This is the full content of your functions/index.js file.
// It is set up to handle file uploads via a HTTPS request.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const path = require("path");
const os = require("os");
const fs = require("fs");
const cors = require("cors")({ origin: true });
const Busboy = require("busboy");
const ical = require("node-ical");

admin.initializeApp();
const db = admin.firestore();

// --- NEW HELPER FUNCTION FOR DOUBLE BOOKING DETECTION ---
const checkForDoubleBooking = async (newBooking, existingBookingId = null) => {
    functions.logger.log(`Checking for double bookings for property: ${newBooking.propertyId}`);
    
    // Query for any bookings on the same property that end after the new booking starts.
    const bookingsRef = db.collection('bookings');
    const q = bookingsRef
        .where('propertyId', '==', newBooking.propertyId)
        .where('endDate', '>', newBooking.startDate);

    const snapshot = await q.get();

    if (snapshot.empty) {
        functions.logger.log("No potential conflicts found.");
        return; // No potential conflicts
    }

    // Now, filter in memory for bookings that start before the new booking ends.
    const conflictingBookings = [];
    snapshot.forEach(doc => {
        // Exclude the booking if it's the one we're currently updating/creating
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
        
        // Create a notification in the 'notifications' collection
        await db.collection('notifications').add(notification);
    }
};


// --- EXISTING FUNCTION ---
exports.uploadProof = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    functions.logger.log("Function triggered. Method:", req.method);
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
        functions.logger.log(`Field [${fieldname}]: value: ${val}`);
        fields[fieldname] = val;
      });

      busboy.on("file", (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        functions.logger.log(`Receiving file: ${filename} (${mimeType}) with encoding ${encoding}`);

        const filepath = path.join(tmpdir, filename);
        uploads[fieldname] = { filepath, mimeType };
        const writeStream = fs.createWriteStream(filepath);
        file.pipe(writeStream);

        const promise = new Promise((resolve, reject) => {
          file.on("end", () => {
            writeStream.end();
          });
          writeStream.on("finish", () => {
            functions.logger.log(`Stream for [${filename}] finished writing.`);
            resolve(true);
          });
          writeStream.on("error", reject);
        });
        fileWrites.push(promise);
      });

      busboy.on("finish", async () => {
        functions.logger.log("Busboy finish event triggered.");
        try {
          await Promise.all(fileWrites);
          functions.logger.log("All files have been written to temp storage.");

          const fileData = uploads.file;
          if (!fileData) {
            throw new Error("File data is missing after write.");
          }

          const { taskId, itemIndex, originalFilename } = fields;
          if (!taskId || !itemIndex || !originalFilename) {
            throw new Error(`Required fields missing. taskId: ${taskId}, itemIndex: ${itemIndex}, originalFilename: ${originalFilename}`);
          }
          
          const bucket = admin.storage().bucket();
          const destination = `proofs/${taskId}/${itemIndex}-${originalFilename}`;
          functions.logger.log(`Attempting to upload to: ${destination}`);

          await bucket.upload(fileData.filepath, {
            destination: destination,
            metadata: { contentType: fileData.mimeType },
          });
          functions.logger.log("Upload to GCS successful.");

          fs.unlinkSync(fileData.filepath);

          const file = bucket.file(destination);
          const [url] = await file.getSignedUrl({
            action: "read",
            expires: "03-09-2491",
          });
          functions.logger.log("Signed URL generated successfully.");

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


// --- UPDATED FUNCTION WITH RULES ENGINE ---
exports.onBookingReceived = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      functions.logger.warn("Received non-POST request.");
      return res.status(405).send({ error: "Method Not Allowed" });
    }

    try {
      const bookingData = req.body;
      functions.logger.log("Received booking data:", JSON.stringify(bookingData));

      // --- VALIDATION ---
      const { propertyId, checkoutDate, guestName } = bookingData;
      if (!propertyId || !checkoutDate) {
        functions.logger.error("Validation failed: propertyId or checkoutDate missing.");
        return res.status(400).send({ error: "Missing required fields: propertyId, checkoutDate." });
      }

      // --- FETCH PROPERTY AND RULES ---
      const propertyRef = db.collection('properties').doc(propertyId);
      const rulesRef = db.collection('automationRules').doc(propertyId);
      
      const [propertyDoc, rulesDoc] = await Promise.all([propertyRef.get(), rulesRef.get()]);

      if (!propertyDoc.exists) {
        functions.logger.error(`Property with ID ${propertyId} not found.`);
        return res.status(404).send({ error: "Property not found." });
      }
      if (!rulesDoc.exists || !rulesDoc.data().rules) {
        functions.logger.info(`No automation rules found for property ${propertyId}. Exiting.`);
        return res.status(200).send({ status: "success", message: "No rules to process." });
      }

      const propertyData = propertyDoc.data();
      const rules = rulesDoc.data().rules;
      const tasksToCreate = [];

      // --- PROCESS RULES ---
      for (const rule of rules) {
        const coDate = new Date(checkoutDate);
        const dueDate = new Date(coDate.setDate(coDate.getDate() + (rule.timeline?.daysAfterCheckout || 0)));
        const formattedDueDate = dueDate.toISOString().split('T')[0];

        const taskData = {
          taskName: `${rule.ruleName} for ${guestName || propertyData.propertyName}`,
          taskType: rule.taskType || 'Cleaning',
          description: `Automated task generated for checkout on ${checkoutDate}.`,
          priority: 'Medium',
          status: 'Pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          propertyId: propertyId,
          propertyName: propertyData.propertyName,
          ownerId: propertyData.ownerId,
          scheduledDate: formattedDueDate,
          assignedTo: rule.defaultAssignee || '',
          assignedToEmail: '', 
          checklistTemplateId: rule.checklistTemplateId || '',
          checklistItems: [],
        };
        
        functions.logger.log(`Prepared task from rule '${rule.ruleName}':`, taskData);
        tasksToCreate.push(db.collection('tasks').add(taskData));
      }

      await Promise.all(tasksToCreate);
      functions.logger.log(`Successfully created ${tasksToCreate.length} tasks for property ${propertyId}.`);

      return res.status(200).send({
        status: "success",
        message: `Processed ${rules.length} rules and created ${tasksToCreate.length} tasks.`,
      });

    } catch (error) {
      functions.logger.error("Error processing booking data:", error);
      return res.status(500).send({ status: "error", message: "Internal server error." });
    }
  });
});

// --- SCHEDULED FUNCTION FOR ICAL SYNC (MODIFIED) ---
exports.syncIcalFeeds = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    functions.logger.log("Starting iCal sync for all properties.");
    const propertiesSnapshot = await db.collection('properties').get();
    if (propertiesSnapshot.empty) {
        functions.logger.log("No properties found to sync.");
        return null;
    }

    for (const doc of propertiesSnapshot.docs) {
        const property = doc.data();
        const propertyId = doc.id;

        if (property.iCalUrl) {
            try {
                const data = await ical.fromURL(property.iCalUrl);
                for (const k in data) {
                    if (data[k].type === 'VEVENT') {
                        const event = data[k];
                        const bookingId = event.uid.split('@')[0];
                        
                        const bookingData = {
                            propertyId: propertyId,
                            propertyName: property.propertyName,
                            ownerId: property.ownerId,
                            guestName: event.summary || 'Booked',
                            startDate: event.start.toISOString().split('T')[0],
                            endDate: event.end.toISOString().split('T')[0],
                            syncedAt: admin.firestore.FieldValue.serverTimestamp()
                        };
                        
                        // Check for conflicts before saving
                        await checkForDoubleBooking(bookingData, bookingId);

                        const bookingRef = db.collection('bookings').doc(bookingId);
                        await bookingRef.set(bookingData, { merge: true });
                    }
                }
            } catch (err) {
                functions.logger.error(`Error processing iCal for property ${propertyId}:`, err);
            }
        }
    }

    functions.logger.log("Finished iCal sync process.");
    return null;
});

// --- ENDPOINT FOR MANUAL BOOKINGS (MODIFIED) ---
exports.addManualBooking = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send({ error: "Method Not Allowed" });
        }

        try {
            const { propertyId, startDate, endDate, guestName } = req.body;
            if (!propertyId || !startDate || !endDate || !guestName) {
                return res.status(400).send({ error: `Missing required fields.` });
            }

            const propertyDoc = await db.collection('properties').doc(propertyId).get();
            if (!propertyDoc.exists) {
                return res.status(404).send({ error: "Property not found." });
            }
            const propertyData = propertyDoc.data();
            const bookingId = `manual_${Date.now()}`;
            
            const newBooking = {
                propertyId: propertyId,
                propertyName: propertyData.propertyName,
                ownerId: propertyData.ownerId,
                guestName: guestName,
                startDate: startDate,
                endDate: endDate,
                syncedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // Check for conflicts before saving
            await checkForDoubleBooking(newBooking, bookingId);

            const bookingRef = db.collection('bookings').doc(bookingId);
            await bookingRef.set(newBooking);

            return res.status(200).send({
                status: "success",
                message: "Manual booking created successfully.",
                bookingId: bookingId,
            });

        } catch (error) {
            functions.logger.error("Error creating manual booking:", error);
            return res.status(500).send({ status: "error", message: "Internal server error." });
        }
    });
});