const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

exports.respondToTaskOffer = functions.https.onCall(async (data, context) => {
    const { taskId, response } = data; // 'accepted' or 'rejected'
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
    const notificationsToSend = [];
    const isPrimary = taskData.assignmentStatus === 'PendingPrimary' && taskData.primaryAssignee === userId;
    const isFallback = taskData.assignmentStatus === 'PendingFallback' && taskData.fallbackAssignee === userId;

    if (!isPrimary && !isFallback) {
        throw new functions.https.HttpsError('permission-denied', 'You are not authorized to respond to this offer.');
    }

    if (response === 'accepted') {
        await taskRef.update({
            status: 'Pending',
            assignmentStatus: 'Accepted',
            assignedTo: userId,
        });
        // Notify property manager of acceptance
    } else if (response === 'rejected') {
        await taskRef.update({ rejectionCount: admin.firestore.FieldValue.increment(1) });
        // Notify property manager of rejection

        if (isPrimary && taskData.fallbackAssignee) {
            await taskRef.update({ assignmentStatus: 'PendingFallback' });
            // Create notification for fallback assignee
        } else {
            await taskRef.update({ status: 'Unassigned', assignmentStatus: 'Rejected' });
            // Notify admins of escalation
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
    if (taskDoc.data().assignedTo !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'You are not assigned to this task.');
    }

    await taskRef.update({
        status: 'Pending Inspection',
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify inspector/manager
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
    // Assuming propertyManagerId is the inspector
    if (userId !== taskData.propertyManagerId) {
        throw new functions.https.HttpsError('permission-denied', 'You are not authorized to review this task.');
    }

    const newStatus = approved ? 'Completed' : 'Requires Revisions';
    await taskRef.update({
        status: newStatus,
        inspection: {
            approved,
            reviewedBy: userId,
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
            comments: comments || '',
        },
    });

    if (!approved && taskData.assignedTo) {
        // Notify assignee that revisions are needed
    }

    return { success: true, newStatus };
});