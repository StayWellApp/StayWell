const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({origin: true});
const db = admin.firestore();

const convertTimestamps = (data) => {
    if (data === null || data === undefined) {
        return data;
    }
    if (typeof data !== 'object') {
        return data;
    }
    if (data instanceof admin.firestore.Timestamp) {
        return data.toDate().toISOString();
    }
    if (Array.isArray(data)) {
        return data.map(item => convertTimestamps(item));
    }
    const newData = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            newData[key] = convertTimestamps(data[key]);
        }
    }
    return newData;
};

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

exports.exportClientData = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { clientId } = req.body.data;
        if (!clientId) {
            return res.status(400).send({ error: 'The function must be called with a "clientId" argument.' });
        }

        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            return res.status(401).send({ error: 'Unauthorized' });
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            if (!decodedToken.superAdmin) {
                return res.status(403).send({ error: 'Permission denied. This function can only be called by a super admin.' });
            }

            const clientDoc = await db.collection('users').doc(clientId).get();
            if (!clientDoc.exists) {
                return res.status(404).send({ error: 'Client not found.' });
            }

            const propertiesQuery = await db.collection('properties').where('ownerId', '==', clientId).get();
            
            const clientData = convertTimestamps(clientDoc.data());
            const properties = propertiesQuery.docs.map(doc => convertTimestamps(doc.data()));

            res.status(200).send({ data: {
                client: clientData,
                properties: properties
            }});
        } catch (error) {
            console.error("Error exporting client data:", error);
            if (error.code === 'auth/id-token-expired') {
                return res.status(401).send({ error: 'Unauthorized' });
            }
            return res.status(500).send({ error: 'An internal error occurred while exporting client data.' });
        }
    });
});

exports.resetClientData = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.superAdmin) {
        throw new functions.https.HttpsError("permission-denied", "This function can only be called by a super admin.");
    }

    const { clientId } = data;
    if (!clientId) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'clientId' argument.");
    }

    try {
        const propertiesQuery = await db.collection('properties').where('ownerId', '==', clientId).get();
        const batch = db.batch();
        propertiesQuery.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        return { success: true, message: "Client data reset successfully." };
    } catch (error) {
        console.error("Error resetting client data:", error);
        throw new functions.https.HttpsError("internal", "An internal error occurred while resetting client data.");
    }
});

exports.suspendClient = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.superAdmin) {
        throw new functions.https.HttpsError("permission-denied", "This function can only be called by a super admin.");
    }

    const { clientId, suspend } = data;
    if (!clientId) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'clientId' argument.");
    }

    try {
        await admin.auth().updateUser(clientId, { disabled: suspend });
        return { success: true, message: `Client account has been ${suspend ? 'suspended' : 'unsuspended'}.` };
    } catch (error) {
        console.error("Error suspending client:", error);
        throw new functions.https.HttpsError("internal", "An internal error occurred while suspending the client account.");
    }
});

exports.deleteClient = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.superAdmin) {
        throw new functions.https.HttpsError("permission-denied", "This function can only be called by a super admin.");
    }

    const { clientId } = data;
    if (!clientId) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'clientId' argument.");
    }

    try {
        // Delete user from Firebase Authentication
        await admin.auth().deleteUser(clientId);

        // Delete user data from Firestore
        await db.collection('users').doc(clientId).delete();

        // Delete all properties owned by the user
        const propertiesQuery = await db.collection('properties').where('ownerId', '==', clientId).get();
        const batch = db.batch();
        propertiesQuery.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        return { success: true, message: "Client account deleted successfully." };
    } catch (error) {
        console.error("Error deleting client:", error);
        throw new functions.https.HttpsError("internal", "An internal error occurred while deleting the client account.");
    }
});