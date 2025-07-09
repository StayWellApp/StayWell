import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCRvsod68MdgMagGx4SKWpK57qM7N7qyZ8",
  authDomain: "staywellapp-49b62.firebaseapp.com",
  projectId: "staywellapp-49b62",
  storageBucket: "staywellapp-49b62.appspot.com",
  messagingSenderId: "240146050261",
  appId: "1:240146050261:web:9b807607032c45a452465c",
  measurementId: "G-N2YJYST032"
};

// --- CORRECT INITIALIZATION ORDER ---

// Step 1: Initialize the main Firebase app
const app = initializeApp(firebaseConfig);

// Step 2: Initialize all the services we need from the app
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Step 3: Export the initialized services so other files can use them
export { db, auth, storage, functions };