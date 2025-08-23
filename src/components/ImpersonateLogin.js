// staywellapp/staywell/StayWell-70115a3c7a3657dd4709bca4cc01a8d068f44fe5/src/components/auth/ImpersonateLogin.js
import React, { useEffect } from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ImpersonateLogin = () => {
    const navigate = useNavigate();
    const auth = getAuth();

    useEffect(() => {
        const token = sessionStorage.getItem('impersonationToken');

        if (token) {
            signInWithCustomToken(auth, token)
                .then(() => {
                    sessionStorage.removeItem('impersonationToken');
                    sessionStorage.setItem('isImpersonating', 'true');
                    navigate('/dashboard'); // Redirect to your main dashboard
                })
                .catch((error) => {
                    console.error("Impersonation sign-in failed:", error);
                    sessionStorage.removeItem('impersonationToken');
                });
        } else {
            console.error("No impersonation token found.");
            navigate('/login');
        }
    }, [auth, navigate]);

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <p className="text-lg">Logging in as impersonated user...</p>
            </div>
        </div>
    );
};

export default ImpersonateLogin;