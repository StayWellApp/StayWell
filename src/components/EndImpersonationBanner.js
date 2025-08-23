// Create this file at: src/components/EndImpersonationBanner.js
import React from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'react-toastify';

const EndImpersonationBanner = () => {
    const adminUid = localStorage.getItem('impersonating_admin_uid');

    // If this key doesn't exist in localStorage, it means we are not impersonating.
    if (!adminUid) {
        return null;
    }

    const endImpersonation = async () => {
        const toastId = toast.loading("Ending session and logging back into admin...");
        try {
            const functions = getFunctions();
            const createReauthenticationToken = httpsCallable(functions, 'createReauthenticationToken');
            
            const result = await createReauthenticationToken({ adminUid });
            const token = result.data.token;

            const auth = getAuth();
            await signInWithCustomToken(auth, token);
            
            // Clean up the localStorage key
            localStorage.removeItem('impersonating_admin_uid');

            toast.update(toastId, { render: "Successfully logged back in as admin!", type: "success", isLoading: false, autoClose: 3000, onClose: () => window.location.reload() });
            
        } catch (error) {
            console.error("Failed to end impersonation:", error);
            toast.update(toastId, { render: `Error: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    return (
        <div className="bg-yellow-400 text-black text-center p-2 fixed top-0 left-0 right-0 z-50 flex items-center justify-center">
            <p className="mr-4">
                You are currently impersonating a user.
            </p>
            <button
                onClick={endImpersonation}
                className="bg-red-600 text-white font-bold py-1 px-3 rounded hover:bg-red-700 transition-colors text-sm"
            >
                End Impersonation
            </button>
        </div>
    );
};

export default EndImpersonationBanner;