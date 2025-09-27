const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

const sendWelcomeEmail = async (email, companyName) => {
    functions.logger.log(`Sending welcome email to ${email} for company ${companyName}.`);
    // This is where you would integrate with an email service like SendGrid or Mailgun.
    return { success: true };
};

exports.createImpersonationToken = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.superAdmin) {
        throw new functions.https.HttpsError("permission-denied", "This function can only be called by a super admin.");
    }
    const { uid } = data;
    if (!uid) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'uid' argument.");
    }
    try {
        const customToken = await admin.auth().createCustomToken(uid);
        return { token: customToken };
    } catch (error) {
        console.error("Error creating custom token:", error);
        throw new functions.https.HttpsError("internal", "An internal error occurred.");
    }
});

exports.logAdminAction = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.superAdmin) {
        throw new functions.https.HttpsError("permission-denied", "This function can only be called by a super admin.");
    }
    const { message } = data;
    if (!message) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'message' argument.");
    }
    await db.collection('auditLog').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        adminEmail: context.auth.token.email,
        action: message,
    });
    return { success: true };
});

exports.createClient = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.superAdmin) {
        throw new functions.https.HttpsError("permission-denied", "This function can only be called by a super admin.");
    }
    const { companyName, email, plan, planExpiration } = data;
    if (!companyName || !email || !plan) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
    }
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            emailVerified: false,
            displayName: companyName,
        });

        await db.collection('users').doc(userRecord.uid).set({
            companyName,
            email,
            role: 'owner',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            subscription: {
                plan,
                status: 'active',
                expiresAt: planExpiration ? new Date(planExpiration) : null,
            },
        });

        await sendWelcomeEmail(email, companyName);
        return { success: true, uid: userRecord.uid };
    } catch (error) {
        functions.logger.error("Error creating client:", error);
        throw new functions.https.HttpsError("internal", "An internal error occurred.");
    }
});

exports.createReauthenticationToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const { adminUid } = data;
    if (!adminUid) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with an 'adminUid'.");
    }
    try {
        const adminUserRecord = await admin.auth().getUser(adminUid);
        if (!adminUserRecord.customClaims || !adminUserRecord.customClaims.superAdmin) {
            throw new functions.https.HttpsError("permission-denied", "The target user is not a super admin.");
        }
    } catch (error) {
        functions.logger.error("Error fetching admin user record:", error);
        throw new functions.https.HttpsError("not-found", "The specified admin user does not exist.");
    }
    const customToken = await admin.auth().createCustomToken(adminUid);
    return { token: customToken };
});