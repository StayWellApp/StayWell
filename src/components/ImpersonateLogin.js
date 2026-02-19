import React, { useEffect, useState } from 'react';
// Import the necessary auth functions, including setPersistence
import { getAuth, setPersistence, browserSessionPersistence, signInWithCustomToken } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ImpersonateLogin = () => {
    const navigate = useNavigate();
    const auth = getAuth();
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem('impersonationToken');

        if (token) {
            // **THIS IS THE FIX**: Set persistence to SESSION for this tab only.
            // This stops it from affecting other tabs.
            setPersistence(auth, browserSessionPersistence)
                .then(() => {
                    // Once persistence is set, sign in with the custom token.
                    return signInWithCustomToken(auth, token);
                })
                .then(() => {
                    // On successful sign-in, clean up and set the flag for the banner.
                    sessionStorage.removeItem('impersonationToken');
                    sessionStorage.setItem('isImpersonating', 'true');
                    // Navigate to the dashboard. The banner will now appear.
                    navigate('/');
                })
                .catch((error) => {
                    console.error("Impersonation sign-in failed:", error);
                    sessionStorage.removeItem('impersonationToken');
                    setError(error.message);
                });
        } else {
            // If there's no token, redirect away.
            navigate('/');
        }
    }, [auth, navigate]);

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen p-4">
                <h1 className="text-2xl font-bold mb-4">Impersonation Failed</h1>
                <p className="text-red-600 mb-4 text-center">{error}</p>
                <p>Please close this tab.</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center h-screen">
            <p className="text-lg">Initiating secure impersonation session...</p>
        </div>
    );
};

export default ImpersonateLogin;
