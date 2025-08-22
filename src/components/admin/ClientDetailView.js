import React from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { toast } from 'react-toastify';
import { ArrowLeft, UserCheck } from 'lucide-react';
import FeatureFlagManager from './FeatureFlagManager';
import ClientSubscriptionManager from './ClientSubscriptionManager'; // Import the new component

const ClientDetailView = ({ client, onBack }) => {
    if (!client) return null;

    const handleImpersonate = async () => {
        if (!window.confirm(`Are you sure you want to log in as ${client.email}? You will be logged out of your admin account.`)) {
            return;
        }

        const toastId = toast.loading("Generating impersonation session...");
        try {
            const functions = getFunctions();
            const createImpersonationToken = httpsCallable(functions, 'createImpersonationToken');
            
            const result = await createImpersonationToken({ uid: client.id });
            const token = result.data.token;

            const auth = getAuth();
            await signInWithCustomToken(auth, token);
            
            toast.update(toastId, { render: "Successfully signed in as client!", type: "success", isLoading: false, autoClose: 3000 });
            // The onAuthStateChanged listener in App.js will handle the redirect.
            // You may need to manually reload if it doesn't happen automatically.
            window.location.reload();

        } catch (error) {
            console.error("Impersonation failed:", error);
            toast.update(toastId, { render: `Impersonation failed: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

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
                {/* Left Column for Actions & Subscriptions */}
                <div className="space-y-8">
                    {/* Subscription Panel */}
                    <ClientSubscriptionManager client={client} />

                    {/* Admin Actions Panel */}
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

                {/* Right Column for Feature Flags */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    {/* This can now be used for client-specific overrides to global flags */}
                    <FeatureFlagManager client={client} />
                </div>
            </div>
        </div>
    );
};

export default ClientDetailView;