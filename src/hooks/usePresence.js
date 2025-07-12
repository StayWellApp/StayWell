import { useEffect } from 'react';
import { getDatabase, ref, onValue, set, onDisconnect } from "firebase/database";
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; // Use setDoc instead of updateDoc
import { auth, db } from '../firebase-config';

// NOTE: This requires enabling Firebase Realtime Database in your project.
export const usePresence = () => {
    useEffect(() => {
        if (!auth.currentUser) return;

        const uid = auth.currentUser.uid;
        const db_rt = getDatabase();
        const userStatusDatabaseRef = ref(db_rt, '/status/' + uid);
        
        const isOfflineForRTDB = {
            state: 'offline',
            last_changed: serverTimestamp(),
        };

        const isOnlineForRTDB = {
            state: 'online',
            last_changed: serverTimestamp(),
        };

        const userStatusFirestoreRef = doc(db, 'status', uid);
        const isOfflineForFirestore = {
            state: 'offline',
            last_changed: serverTimestamp(),
        };
        const isOnlineForFirestore = {
            state: 'online',
            last_changed: serverTimestamp(),
        };

        const conRef = ref(db_rt, '.info/connected');
        const unsubscribe = onValue(conRef, (snapshot) => {
            if (snapshot.val() === false) {
                // Use setDoc with merge to safely create/update the document.
                setDoc(userStatusFirestoreRef, isOfflineForFirestore, { merge: true });
                return;
            }

            onDisconnect(userStatusDatabaseRef).set(isOfflineForRTDB).then(() => {
                set(userStatusDatabaseRef, isOnlineForRTDB);
                // Use setDoc with merge here as well for safety.
                setDoc(userStatusFirestoreRef, isOnlineForFirestore, { merge: true });
            });
        });

        return () => unsubscribe();
    }, []);
};
