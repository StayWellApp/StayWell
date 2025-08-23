// staywellapp/staywell/StayWell-70115a3c7a3657dd4709bca4cc01a8d068f44fe5/src/components/ImpersonationBanner.js
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

const ImpersonationBanner = () => {
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [userName, setUserName] = useState('');
    const auth = getAuth();

    useEffect(() => {
        const impersonating = sessionStorage.getItem('isImpersonating') === 'true';
        setIsImpersonating(impersonating);

        if (impersonating) {
            const unsubscribe = auth.onAuthStateChanged(user => {
                if (user) {
                    setUserName(user.displayName || user.email);
                }
            });
            return () => unsubscribe();
        }
    }, [auth]);

    if (!isImpersonating) {
        return null;
    }

    return (
        <div className="bg-yellow-400 text-black text-center p-2 fixed top-0 left-0 right-0 z-50">
            <p>
                You are currently viewing as <strong>{userName}</strong>. Close this tab to return to your admin account.
            </p>
        </div>
    );
};

export default ImpersonationBanner;