// This is the full content of your functions/index.js file.
// It is set up to handle file uploads via a HTTPS request.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const path = require("path");
const os = require("os");
const fs =require("fs");
const cors = require("cors")({ origin: true });
const Busboy = require("busboy");

admin.initializeApp();

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

          // Clean up the temporary file
          fs.unlinkSync(fileData.filepath);

          const file = bucket.file(destination);
          const [url] = await file.getSignedUrl({
            action: "read",
            expires: "03-09-2491", // A far-future expiration date
          });
          functions.logger.log("Signed URL generated successfully.");

          return res.status(200).send({ proofURL: url });
        } catch (error) {
          functions.logger.error("Error in 'finish' handler:", error);
          return res.status(500).send({ error: "Processing failed on server." });
        }
      });

      // The rawBody is automatically parsed by Cloud Functions.
      // We pass it to busboy.end().
      busboy.end(req.rawBody);
    } catch (error) {
      functions.logger.error("Critical error in function execution:", error);
      return res.status(500).send({ error: "Function execution failed." });
    }
  });
});


// --- NEW FUNCTION ---
// This function will be triggered by a webhook from your calendar syncing service.
exports.onBookingReceived = functions.https.onRequest((req, res) => {
  // We use cors to allow requests from the third-party service.
  cors(req, res, () => {
    if (req.method !== "POST") {
      functions.logger.warn("Received non-POST request.");
      return res.status(405).send({ error: "Method Not Allowed" });
    }

    try {
      const bookingData = req.body;
      
      // Log the incoming data for debugging purposes.
      // In Firebase console, you can check Logs Explorer for "onBookingReceived".
      functions.logger.log("Received new booking data:", JSON.stringify(bookingData));
      
      // Here is where you would trigger the full rules engine.
      // For now, we just acknowledge receipt of the data.
      // TODO: Implement `createTasksForBooking(bookingData)` logic.

      // Send a success response back to the webhook sender.
      return res.status(200).send({ 
          status: "success", 
          message: "Booking data received and logged." 
      });

    } catch (error) {
      functions.logger.error("Error processing booking data:", error);
      return res.status(500).send({ 
          status: "error", 
          message: "Internal server error." 
      });
    }
  });
});