import React from 'react';
import { XCircle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase-config';
import { toast } from 'react-toastify';

const EndImpersonationBanner = () => {
    const adminUid = localStorage.getItem('impersonating_admin_uid');

    if (!adminUid) {
        return null;
    }

    const handleEndImpersonation = async () => {
        toast.info("Ending impersonation session...");
        try {
            const functions = getFunctions();
            // Ensure you are calling the correctly exported function name
            const createReauthenticationToken = httpsCallable(functions, 'createReauthenticationToken');

            const result = await createReauthenticationToken({ adminUid });
            const { token } = result.data;

            if (token) {
                await signInWithCustomToken(auth, token);
                
                localStorage.removeItem('impersonating_admin_uid');

                window.location.href = '/admin/dashboard';
            } else {
                throw new Error("No reauthentication token returned.");
            }
        } catch (error) {
            console.error("Failed to end impersonation:", error);
            toast.error("Could not end impersonation session. Please try signing out and back in.");
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-yellow-900 p-2 flex items-center justify-center z-50">
            <p className="text-sm font-semibold">
                You are currently impersonating a client.
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