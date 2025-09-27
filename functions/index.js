// functions/index.js

const admin = require("firebase-admin");
admin.initializeApp();

// Import all functions from their modules
const activityLogs = require('./src/activity-logs');
const automation = require('./src/automation');
const adminTasks = require('./src/admin');
const tasks = require('./src/tasks');

// Export each function individually at the top level
// This makes them discoverable by Firebase
exports.logUserCreation = activityLogs.logUserCreation;
exports.logUserUpdates = activityLogs.logUserUpdates;
exports.logPropertyCreation = activityLogs.logPropertyCreation;
exports.logPropertyUpdates = activityLogs.logPropertyUpdates;

exports.uploadProof = automation.uploadProof;
exports.onBookingReceived = automation.onBookingReceived;
exports.syncIcalFeeds = automation.syncIcalFeeds;
exports.addManualBooking = automation.addManualBooking;

exports.createImpersonationToken = adminTasks.createImpersonationToken;
exports.logAdminAction = adminTasks.logAdminAction;
exports.createClient = adminTasks.createClient;
exports.createReauthenticationToken = adminTasks.createReauthenticationToken;

exports.respondToTaskOffer = tasks.respondToTaskOffer;
exports.submitForInspection = tasks.submitForInspection;
exports.reviewTask = tasks.reviewTask;