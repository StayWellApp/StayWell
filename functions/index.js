// This is the full content of your functions/index.js file.
// It is set up to handle file uploads via a HTTPS request.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const path = require("path");
const os = require("os");
const fs = require("fs");
const cors = require("cors")({ origin: true });
const Busboy = require("busboy");

admin.initializeApp();
const db = admin.firestore();

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
      // The third-party service must send at least these fields.
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
        // Calculate due date
        const coDate = new Date(checkoutDate);
        const dueDate = new Date(coDate.setDate(coDate.getDate() + (rule.timeline?.daysAfterCheckout || 0)));
        const formattedDueDate = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD

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
          assignedTo: rule.defaultAssignee || '', // Add fallback logic if needed
          
          // You might need to fetch assignee email separately or store it in the rule
          assignedToEmail: '', 
          
          // If a checklist is linked, prepare it for the new task
          checklistTemplateId: rule.checklistTemplateId || '',
          checklistItems: [], // This would be populated by fetching the template
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