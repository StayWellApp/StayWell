import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCRvsod68MdgMagGx4SKWpK57qM7N7qyZ8",
  authDomain: "staywellapp-49b62.firebaseapp.com",
  projectId: "staywellapp-49b62",
  storageBucket: "staywellapp-49b62.firebasestorage.app",
  messagingSenderId: "240146050261",
  appId: "1:240146050261:web:9b807607032c45a452465c",
  measurementId: "G-N2YJYST032"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { db, auth, storage, functions };