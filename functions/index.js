// This is the full content of your functions/index.js file.
// It is set up to handle file uploads, booking webhooks, and iCal sync.

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

// --- REUSABLE AUTOMATION FUNCTION ---
const triggerAutomationForBooking = async (bookingDetails) => {
    const { propertyId, checkoutDate, guestName } = bookingDetails;
    functions.logger.log(`Triggering automation for propertyId: ${propertyId}`);

    if (!propertyId || !checkoutDate) {
        functions.logger.error("Automation trigger failed: Missing propertyId or checkoutDate.");
        return; // Exit if essential data is missing
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
            status: 'Pending Assignment', // New status
            assignmentStatus: 'PendingPrimary', // To track who the offer is for
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            propertyId: propertyId,
            propertyName: propertyData.propertyName,
            ownerId: propertyData.ownerId,
            scheduledDate: formattedDueDate,
            primaryAssignee: rule.defaultAssignee || '',
            fallbackAssignee: rule.fallbackAssignee || '', // Assuming you add this to your rules
            assignedTo: '', // Initially unassigned
            assignedToEmail: '',
            rejectionCount: 0,
            checklistTemplateId: rule.checklistTemplateId || '',
            checklistItems: [], // Checklist items will be populated from the template
        };

        const taskCreationPromise = db.collection('tasks').add(taskData).then(docRef => {
            // Create notification for the primary assignee
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

exports.respondToTaskOffer = functions.https.onCall(async (data, context) => {
    const { taskId, response } = data; // response can be 'accepted' or 'rejected'
    const userId = context.auth.uid;

    if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to respond to a task offer.');
    }

    const taskRef = db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Task not found.');
    }

    const taskData = taskDoc.data();
    const notificationsToSend = [];

    // Check if the user is the current assignee
    const isPrimary = taskData.assignmentStatus === 'PendingPrimary' && taskData.primaryAssignee === userId;
    const isFallback = taskData.assignmentStatus === 'PendingFallback' && taskData.fallbackAssignee === userId;

    if (!isPrimary && !isFallback) {
        throw new functions.https.HttpsError('permission-denied', 'You are not authorized to respond to this task offer.');
    }

    if (response === 'accepted') {
        await taskRef.update({
            status: 'Pending',
            assignmentStatus: 'Accepted',
            assignedTo: userId,
        });

        // Notify property manager of acceptance
        const managerNotification = {
            // You need a way to get property manager's ID. Assuming it's stored on the property.
            userId: taskData.propertyManagerId, // This field needs to be added to your property data
            type: "TASK_ACCEPTED",
            message: `Task "${taskData.taskName}" has been accepted by ${context.auth.token.name || 'a user'}.`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
        };
        notificationsToSend.push(db.collection('notifications').add(managerNotification));

    } else if (response === 'rejected') {
        const newRejectionCount = (taskData.rejectionCount || 0) + 1;
        await taskRef.update({ rejectionCount: newRejectionCount });

        // Notify property manager of rejection
        const managerRejectionNotification = {
            userId: taskData.propertyManagerId,
            type: "TASK_REJECTED",
            message: `Task "${taskData.taskName}" has been rejected by ${context.auth.token.name || 'a user'}.`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
        };
        notificationsToSend.push(db.collection('notifications').add(managerRejectionNotification));


        if (isPrimary && taskData.fallbackAssignee) {
            // Offer to fallback assignee
            await taskRef.update({ assignmentStatus: 'PendingFallback' });
            const fallbackNotification = {
                userId: taskData.fallbackAssignee,
                taskId: taskId,
                type: "NEW_TASK_OFFER",
                message: `A task has become available: "${taskData.taskName}" for property "${taskData.propertyName}".`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isRead: false,
            };
            notificationsToSend.push(db.collection('notifications').add(fallbackNotification));
        } else {
            // No fallback or fallback also rejected, notify admins
            await taskRef.update({ status: 'Unassigned', assignmentStatus: 'Rejected' });
            const adminUsers = [taskData.ownerId, taskData.propertyManagerId, /* another admin role */];
            for (const adminId of adminUsers) {
                if(adminId) {
                    const escalationNotification = {
                        userId: adminId,
                        taskId: taskId,
                        type: "TASK_UNASSIGNED",
                        message: `Task "${taskData.taskName}" is unassigned after being rejected.`,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        isRead: false,
                    };
                    notificationsToSend.push(db.collection('notifications').add(escalationNotification));
                }
            }
        }
    } else {
        throw new functions.https.HttpsError('invalid-argument', 'Response must be "accepted" or "rejected".');
    }

    await Promise.all(notificationsToSend);
    return { success: true };
});

exports.submitForInspection = functions.https.onCall(async (data, context) => {
    const { taskId } = data;
    const userId = context.auth.uid;

    if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }

    const taskRef = db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Task not found.');
    }

    const taskData = taskDoc.data();
    if (taskData.assignedTo !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'You are not assigned to this task.');
    }

    await taskRef.update({
        status: 'Pending Inspection',
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify inspector/manager
    const inspectorId = taskData.propertyManagerId; // Or a dedicated inspector field
    if (inspectorId) {
        const notification = {
            userId: inspectorId,
            taskId: taskId,
            type: "TASK_PENDING_INSPECTION",
            message: `Task "${taskData.taskName}" is ready for inspection.`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
        };
        await db.collection('notifications').add(notification);
    }

    return { success: true };
});

exports.reviewTask = functions.https.onCall(async (data, context) => {
    const { taskId, approved, comments } = data;
    const userId = context.auth.uid;

    if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }

    const taskRef = db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Task not found.');
    }

    const taskData = taskDoc.data();
    // Logic to check if the user is an authorized inspector
    // For now, let's assume the property manager is the inspector
    if (userId !== taskData.propertyManagerId) {
        throw new functions.https.HttpsError('permission-denied', 'You are not authorized to review this task.');
    }

    if (approved) {
        await taskRef.update({
            status: 'Completed',
            inspection: {
                approved: true,
                reviewedBy: userId,
                reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
                comments: comments || '',
            },
        });
    } else {
        await taskRef.update({
            status: 'Requires Revisions',
            inspection: {
                approved: false,
                reviewedBy: userId,
                reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
                comments: comments || 'No comments provided.',
            },
        });

        // Notify the original assignee that revisions are needed
        if (taskData.assignedTo) {
            const notification = {
                userId: taskData.assignedTo,
                taskId: taskId,
                type: "TASK_REVISIONS_REQUIRED",
                message: `Revisions are required for task: "${taskData.taskName}".`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isRead: false,
            };
            await db.collection('notifications').add(notification);
        }
    }

    return { success: true, newStatus: approved ? 'Completed' : 'Requires Revisions' };
});

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


// --- EXISTING UPLOAD FUNCTION ---
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

          // Now, update the checklist item with the photo URL
          const taskRef = db.collection('tasks').doc(taskId);
          const taskDoc = await taskRef.get();
          if (taskDoc.exists) {
              const taskData = taskDoc.data();
              const checklistItems = taskData.checklistItems || [];
              const itemToUpdate = checklistItems[itemIndex];

              if (itemToUpdate) {
                  itemToUpdate.photoURL = url;
                  await taskRef.update({ checklistItems: checklistItems });
                  functions.logger.log(`Task ${taskId}, item ${itemIndex} updated with photo URL.`);
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


// --- AUTOMATION WEBHOOK (NOW USES THE REUSABLE FUNCTION) ---
exports.onBookingReceived = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({ error: "Method Not Allowed" });
    }
    try {
      const bookingData = req.body;
      functions.logger.log("Received booking data via webhook:", JSON.stringify(bookingData));

      await triggerAutomationForBooking(bookingData);

      return res.status(200).send({
        status: "success",
        message: "Booking data received and automation triggered.",
      });
    } catch (error) {
      functions.logger.error("Error in onBookingReceived:", error);
      return res.status(500).send({ status: "error", message: "Internal server error." });
    }
  });
});

// --- ICAL SYNC FUNCTION ---
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


// --- MANUAL BOOKING ENDPOINT (MODIFIED TO TRIGGER AUTOMATION) ---
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

            await checkForDoubleBooking(newBooking, bookingId);

            const bookingRef = db.collection('bookings').doc(bookingId);
            await bookingRef.set(newBooking);

            await triggerAutomationForBooking({
                propertyId: propertyId,
                checkoutDate: endDate,
                guestName: guestName,
            });

            return res.status(200).send({
                status: "success",
                message: "Manual booking created and automation triggered.",
                bookingId: bookingId,
            });

        } catch (error) {
            functions.logger.error("Error creating manual booking:", error);
            return res.status(500).send({ status: "error", message: "Internal server error." });
        }
    });
});

// --- SUPER ADMIN FUNCTION ---
exports.createImpersonationToken = functions.https.onCall(async (data, context) => {
  // 1. Check for authentication and superAdmin claim
  if (!context.auth || !context.auth.token.superAdmin) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "This function can only be called by a super admin.",
    );
  }

  const impersonatedUid = data.uid;
  if (!impersonatedUid) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with a 'uid' argument.",
    );
  }

  // 2. Generate the custom token for the target user
  try {
    const customToken = await admin.auth().createCustomToken(impersonatedUid);
    return { token: customToken };
  } catch (error) {
    console.error("Error creating custom token:", error);
    throw new functions.https.HttpsError(
        "internal",
        "An internal error occurred while creating the impersonation token.",
    );
  }
});

// --- NEW AUDIT LOG FUNCTION ---
/**
 * Logs an action taken by a super admin to a dedicated audit collection.
 */
exports.logAdminAction = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.superAdmin) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "This function can only be called by a super admin.",
    );
  }

  const adminEmail = context.auth.token.email;
  const message = data.message;

  if (!message) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with a 'message' argument.",
    );
  }

  await admin.firestore().collection('auditLog').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      adminEmail: adminEmail,
      action: message,
  });

  return { success: true };
});

// --- SEND WELCOME EMAIL ---
// This is a placeholder for your actual email sending logic (e.g., using SendGrid, Mailgun)
const sendWelcomeEmail = async (email, companyName) => {
    functions.logger.log(`Sending welcome email to ${email} for company ${companyName}.`);
    // In a real application, you would integrate with an email service here.
    return { success: true };
};

// --- CREATE CLIENT FUNCTION ---
exports.createClient = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.superAdmin) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "This function can only be called by a super admin.",
        );
    }

    const { companyName, email, plan, planExpiration } = data;

    if (!companyName || !email || !plan) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Missing required fields: companyName, email, plan.",
        );
    }

    try {
        // Create user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email: email,
            emailVerified: false,
            displayName: companyName,
        });

        // Add user to Firestore 'users' collection
        await db.collection('users').doc(userRecord.uid).set({
            companyName: companyName,
            email: email,
            role: 'owner',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            subscription: {
                plan: plan,
                status: 'active',
                expiresAt: planExpiration ? new Date(planExpiration) : null,
            },
        });

        // Send a welcome email
        await sendWelcomeEmail(email, companyName);

        return { success: true, uid: userRecord.uid };
    } catch (error) {
        functions.logger.error("Error creating client:", error);
        throw new functions.https.HttpsError(
            "internal",
            "An internal error occurred while creating the client.",
        );
    }
});

// --- SUPER ADMIN RE-AUTHENTICATION FUNCTION ---
exports.createReauthenticationToken = functions.https.onCall(async (data, context) => {
    // This function must be called by an authenticated user (the impersonated client).
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to end impersonation.");
    }

    const adminUid = data.adminUid;
    if (!adminUid) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with an 'adminUid'.");
    }
    
    // Security check: Make sure the target UID belongs to a user with superAdmin privileges.
    try {
        const adminUserRecord = await admin.auth().getUser(adminUid);
        if (!adminUserRecord.customClaims || !adminUserRecord.customClaims.superAdmin) {
             throw new functions.https.HttpsError("permission-denied", "The target user is not a super admin.");
        }
    } catch (error) {
        functions.logger.error("Error fetching admin user record:", error);
        throw new functions.https.HttpsError("not-found", "The specified admin user does not exist.");
    }

    // If the check passes, generate a new custom token for the admin.
    const customToken = await admin.auth().createCustomToken(adminUid);
    return { token: customToken };
});