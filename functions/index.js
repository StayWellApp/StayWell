// functions/index.js

const admin = require("firebase-admin");
admin.initializeApp();

const activityLogs = require('./src/activity-logs');
const automation = require('./src/automation');
const adminTasks = require('./src/admin');
const tasks = require('./src/tasks');

exports.activity = activityLogs;
exports.automation = automation;
exports.admin = adminTasks;
exports.tasks = tasks;