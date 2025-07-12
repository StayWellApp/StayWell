import { useEffect } from 'react';
import { getDatabase, ref, onValue, set, onDisconnect } from "firebase/database";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebase-config';

// NOTE: This requires enabling Firebase Realtime Database in your project.
export const usePresence = () => {
    useEffect(() => {
        // This effect should only run once when the component mounts.
        // The onAuthStateChanged listener in App.js ensures this hook is
        // only active when a user is logged in.
        if (!auth.currentUser) return;

        const uid = auth.currentUser.uid;
        const db_rt = getDatabase(); // Realtime Database instance
        const userStatusDatabaseRef = ref(db_rt, '/status/' + uid);
        
        const isOfflineForRTDB = {
            state: 'offline',
            last_changed: serverTimestamp(), // Use RTDB server timestamp
        };

        const isOnlineForRTDB = {
            state: 'online',
            last_changed: serverTimestamp(),
        };

        // Firestore reference for updating status (for querying)
        const userStatusFirestoreRef = doc(db, 'status', uid);
        const isOfflineForFirestore = {
            state: 'offline',
            last_changed: serverTimestamp(), // Firestore server timestamp
        };
        const isOnlineForFirestore = {
            state: 'online',
            last_changed: serverTimestamp(),
        };

        const conRef = ref(db_rt, '.info/connected');
        const unsubscribe = onValue(conRef, (snapshot) => {
            if (snapshot.val() === false) {
                // If not connected, update firestore status
                 updateDoc(userStatusFirestoreRef, isOfflineForFirestore);
                return;
            }

            // When connection is established, set online status and set onDisconnect handler
            onDisconnect(userStatusDatabaseRef).set(isOfflineForRTDB).then(() => {
                set(userStatusDatabaseRef, isOnlineForRTDB);
                updateDoc(userStatusFirestoreRef, isOnlineForFirestore);
            });
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, []); // Empty dependency array ensures this runs only once.
};
