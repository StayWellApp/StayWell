// --- src/hooks/usePermissions.js ---

import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const usePermissions = (userData) => {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userData) {
            setLoading(false);
            return;
        }

        // The Owner role implicitly has all permissions.
        const isOwner = userData.uid === userData.ownerId;
        if (isOwner) {
            // We can create a proxy to always return true for any permission check.
            const ownerPermissions = new Proxy({}, {
                get: () => true,
            });
            setPermissions(ownerPermissions);
            setLoading(false);
            return;
        }

        // For other roles, fetch their permissions from the 'customRoles' collection.
        const rolesQuery = query(collection(db, "customRoles"), where("ownerId", "==", userData.ownerId), where("roleName", "==", userData.role));
        
        const unsubscribe = onSnapshot(rolesQuery, (snapshot) => {
            if (!snapshot.empty) {
                // Assuming role names are unique per owner, we take the first one.
                const roleDoc = snapshot.docs[0];
                setPermissions(roleDoc.data().permissions || {});
            } else {
                // If no specific role is found (e.g., for default roles not in the DB),
                // they have no permissions by default.
                setPermissions({});
            }
            setLoading(false);
        });

        return () => unsubscribe();

    }, [userData]);

    const hasPermission = (permissionId) => {
        return !!permissions[permissionId];
    };

    return { hasPermission, loadingPermissions: loading };
};