const functions = require("firebase-functions");

exports.requireAuth = (context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
};

exports.requireSuperAdmin = (context) => {
    if (!context.auth || !context.auth.token.superAdmin) {
        throw new functions.https.HttpsError("permission-denied", "This function can only be called by a super admin.");
    }
};
