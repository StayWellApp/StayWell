// src/components/admin/ClientDetailView.js
import React from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signInWithCustomToken } from 'firebase/auth'; // <-- Add getAuth & signInWithCustomToken
import { toast } from 'react-toastify';
import { ArrowLeft, UserCheck } from 'lucide-react';
import FeatureFlagManager from './FeatureFlagManager';
import ClientSubscriptionManager from './ClientSubscriptionManager';

const ClientDetailView = ({ client, onBack }) => {
    if (!client) return null;

    const handleImpersonate = async () => {
        const auth = getAuth();
        const adminUser = auth.currentUser;

        if (!adminUser) {
            toast.error("Admin user not found. Please log in again.");
            return;
        }

        const toastId = toast.loading("Initiating impersonation session...");
        try {
            const functions = getFunctions();
            const createImpersonationToken = httpsCallable(functions, 'createImpersonationToken');
            
            const result = await createImpersonationToken({ uid: client.id });
            const token = result.data.token;

            // Store the admin's UID in localStorage to be able to log back in.
            localStorage.setItem('impersonating_admin_uid', adminUser.uid);

            // Sign in as the client in the current tab.
            await signInWithCustomToken(auth, token);
            
            toast.update(toastId, { render: "Successfully signed in as client!", type: "success", isLoading: false, autoClose: 2000, onClose: () => window.location.reload() });
            // The reload will trigger App.js to show the client's view and the new banner.
            
        } catch (error) {
            console.error("Impersonation failed:", error);
            localStorage.removeItem('impersonating_admin_uid'); // Clean up on failure
            toast.update(toastId, { render: `Failed to start session: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    // The component's JSX remains the same as before...
    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <button onClick={onBack} className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6">
                    <ArrowLeft size={14} className="mr-2" />
                    Back to Client List
                </button>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{client.companyName}</h2>
                <p className="text-gray-500 dark:text-gray-400">{client.email}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <ClientSubscriptionManager client={client} />
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Admin Actions</h3>
                        <div className="space-y-4">
                            <button onClick={handleImpersonate} className="button-secondary w-full flex items-center justify-center">
                                <UserCheck size={16} className="mr-2" />
                                Impersonate User
                            </button>
                             <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Log in as this user to troubleshoot issues.</p>
                        </div>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <FeatureFlagManager client={client} />
                </div>
            </div>
        </div>
    );
};

export default ClientDetailView;