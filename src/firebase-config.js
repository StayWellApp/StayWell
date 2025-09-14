// src/firebase-config.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// --- UPDATED: Import initializeAuth and indexedDBLocalPersistence ---
import { initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyCRvsod68MdgMagGx4SKWpK57qM7N7qyZ8",
    authDomain: "staywellapp-49b62.firebaseapp.com",
    projectId: "staywellapp-49b62",
    storageBucket: "staywellapp-49b62.appspot.com", // Corrected storage bucket URL
    messagingSenderId: "240146050261",
    appId: "1:240146050261:web:9b807607032c45a452465c",
    measurementId: "G-N2YJYST032"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// --- FIX: Initialize Auth immediately after the app with persistence ---
// This ensures 'auth' is compatible with Email Enumeration Protection.
const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence
});

// Initialize other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { db, auth, storage, functions };