import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCRvsod68MdgMagGx4SKWpK57qM7N7qyZ8",
  authDomain: "staywellapp-49b62.firebaseapp.com",
  projectId: "staywellapp-49b62",
  storageBucket: "staywellapp-49b62.appspot.com",
  messagingSenderId: "240146050261",
  appId: "1:240146050261:web:9b807607032c45a452465c",
  measurementId: "G-N2YJYST032"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);