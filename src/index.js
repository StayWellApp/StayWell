import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/**
 * Creates a standardized activity log entry.
 * @param {string} clientId The UID of the client the log is for.
 * @param {string} type A category for the event (e.g., 'USER', 'SUBSCRIPTION').
 * @param {string} description A human-readable description of what happened.
 * @param {string} performedBy UID of the user who triggered the event.
 */
const createActivityLog = (clientId, type, description, performedBy) => {
    return db.collection("users").doc(clientId).collection("activity_logs").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type,
        description,
        performedBy: performedBy || "system", // Default to system if no user is specified
    });
};

// --- Activity Log Triggers ---

// Log when a new client user is created
exports.logUserCreation = functions.firestore
    .document("users/{userId}")
    .onCreate((snap, context) => {
        const newUser = snap.data();
        const { userId } = context.params;

        if (newUser.role === "owner") {
            const description = `Client account created.`;
            return createActivityLog(userId, "USER_CREATED", description, userId);
        }
        return null;
    });

// Log significant updates to a client's document
exports.logUserUpdates = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const { userId } = context.params;

        // For simplicity, we'll focus on subscription changes.
        // This can be expanded to check for other changes (e.g., name, email).
        const oldSub = before.subscription || {};
        const newSub = after.subscription || {};

        if (oldSub.planName !== newSub.planName) {
            const description = `Subscription changed from ${oldSub.planName || 'None'} to ${newSub.planName || 'None'}.`;
            // In a real app, you'd get the admin UID who made the change. For now, we'll log it as the user themselves.
            return createActivityLog(userId, "SUBSCRIPTION_UPDATED", description, userId);
        }
        
        // You could add more checks here, e.g., for status changes:
        if (before.status !== after.status) {
             const description = `Status changed from ${before.status} to ${after.status}.`;
             return createActivityLog(userId, "STATUS_CHANGED", description, userId);
        }

        return null;
    });

// Log when a new property is created for a client
exports.logPropertyCreation = functions.firestore
    .document("properties/{propertyId}")
    .onCreate((snap, context) => {
        const property = snap.data();
        const ownerId = property.ownerId;

        if (ownerId) {
            const description = `New property added: "${property.name || 'Unnamed Property'}".`;
            return createActivityLog(ownerId, "PROPERTY_ADDED", description, ownerId);
        }
        return null;
    });