const functions = require("firebase-functions");

/**
 * Validates that the request is authenticated.
 * @param {functions.https.CallableContext} context
 * @returns {string} The authenticated user's UID.
 * @throws {functions.https.HttpsError} If the user is not authenticated.
 */
exports.requireAuth = (context) => {
    if (!context.auth || !context.auth.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }
    return context.auth.uid;
};
