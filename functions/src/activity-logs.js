const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

const createActivityLog = (clientId, type, description, performedBy) => {
    return db.collection("users").doc(clientId).collection("activity_logs").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type,
        description,
        performedBy: performedBy || "system",
    });
};

exports.logUserCreation = functions.firestore
    .document("users/{userId}")
    .onCreate((snap, context) => {
        const newUser = snap.data();
        if (newUser.role === "owner") {
            const description = `Client account created.`;
            return createActivityLog(context.params.userId, "USER_CREATED", description, context.params.userId);
        }
        return null;
    });

exports.logUserUpdates = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const { userId } = context.params;

        if ((before.subscription || {}).planName !== (after.subscription || {}).planName) {
            const description = `Subscription changed from ${(before.subscription || {}).planName || 'None'} to ${(after.subscription || {}).planName || 'None'}.`;
            return createActivityLog(userId, "SUBSCRIPTION_UPDATED", description, userId);
        }
        if (before.status !== after.status) {
             const description = `Status changed from ${before.status} to ${after.status}.`;
             return createActivityLog(userId, "STATUS_CHANGED", description, userId);
        }
        return null;
    });

exports.logPropertyCreation = functions.firestore
    .document("properties/{propertyId}")
    .onCreate((snap, context) => {
        const property = snap.data();
        if (property.ownerId) {
            const description = `New property added: "${property.propertyName || 'Unnamed Property'}".`;
            return createActivityLog(property.ownerId, "PROPERTY_ADDED", description, property.ownerId);
        }
        return null;
    });
    
exports.logPropertyUpdates = functions.firestore
    .document("properties/{propertyId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        if (before.propertyName !== after.propertyName) {
            const description = `Property name changed from "${before.propertyName}" to "${after.propertyName}".`;
            return createActivityLog(after.ownerId, "PROPERTY_UPDATED", description, after.ownerId);
        }
        return null;
    });

// --- NEW FUNCTION TO LOG PROPERTY DELETIONS ---
exports.logPropertyDeletion = functions.firestore
    .document("properties/{propertyId}")
    .onDelete((snap, context) => {
        const deletedProperty = snap.data();
        const ownerId = deletedProperty.ownerId;

        if (ownerId) {
            const description = `Property deleted: "${deletedProperty.propertyName || 'Unnamed Property'}".`;
            // For deletions, we'll log who performed it as the owner, since the actor might not be available.
            return createActivityLog(ownerId, "PROPERTY_DELETED", description, ownerId);
        }
        return null;
    });