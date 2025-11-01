import React, { useState, useEffect } from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const EndImpersonationBanner = () => {
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [userName, setUserName] = useState('');
    const auth = getAuth();

    useEffect(() => {
        const adminUid = localStorage.getItem('impersonating_admin_uid');
        const impersonating = !!adminUid;
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

    const handleEndImpersonation = async () => {
        const adminUid = localStorage.getItem('impersonating_admin_uid');
        if (!adminUid) {
            toast.error("Could not determine the admin to return to.");
            return;
        }

        toast.info("Ending impersonation session...");
        try {
            const functions = getFunctions();
            const createReauthenticationToken = httpsCallable(functions, 'createReauthenticationToken');

            const result = await createReauthenticationToken({ adminUid });
            const { token } = result.data;

            if (token) {
                await signInWithCustomToken(auth, token);
                localStorage.removeItem('impersonating_admin_uid');
                sessionStorage.removeItem('isImpersonating'); // Clean up session storage as well
                window.location.href = '/admin/dashboard';
            } else {
                throw new Error("No reauthentication token returned.");
            }
        } catch (error) {
            console.error("Failed to end impersonation:", error);
            toast.error("Could not end impersonation session. Please try signing out and back in.");
        }
    };

    if (!isImpersonating) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 p-2 flex items-center justify-center z-50">
            <p className="text-sm font-semibold">
                You are currently viewing as <strong>{userName}</strong>.
            </p>
            <button
                onClick={handleEndImpersonation}
                className="ml-4 flex items-center text-sm font-bold text-yellow-900 hover:text-black"
            >
                <XCircle className="h-4 w-4 mr-1" />
                End Session
            </button>
        </div>
    );
};

export default EndImpersonationBanner;
