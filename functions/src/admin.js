const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

const sendWelcomeEmail = async (email, companyName) => {
    functions.logger.log(`Sending welcome email to ${email} for company ${companyName}.`);
    return { success: true };
};

exports.createImpersonationToken = functions.https.onCall(/* ... */);
exports.logAdminAction = functions.https.onCall(/* ... */);
exports.createClient = functions.https.onCall(/* ... */);
exports.createReauthenticationToken = functions.https.onCall(/* ... */);
// NOTE: Copy the full code for the functions above from your old index.js into this file.