import React, { useState } from 'react';
import { functions } from '../../../firebase-config';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'react-toastify';
import ClientSubscriptionManager from '../ClientSubscriptionManager';
import FeatureFlagManager from '../FeatureFlagManager';
import { UserSearch, Shield, Power } from 'lucide-react'; // Added icons

const ManagementTab = ({ client, refreshClientData, allPlans, loadingPlans, onImpersonate }) => {
    const [togglingStatus, setTogglingStatus] = useState(false);

    // --- FIX: Guard clause to prevent rendering without client data ---
    if (!client) {
        return <div>Loading management details...</div>;
    }

    const handleToggleStatus = async () => {
        const newStatus = client.status === 'active' ? 'disabled' : 'active';
        const confirmMessage = newStatus === 'disabled'
            ? "Are you sure you want to DISABLE this client? They will not be able to log in."
            : "Are you sure you want to ACTIVATE this client?";

        if (!window.confirm(confirmMessage)) return;

        setTogglingStatus(true);
        try {
            const toggleUserStatus = httpsCallable(functions, 'toggleUserStatus');
            await toggleUserStatus({ uid: client.id, disabled: newStatus === 'disabled' });

            toast.success(`Client ${newStatus === 'active' ? 'activated' : 'disabled'} successfully.`);
            // Trigger a data refresh if possible, or wait for onSnapshot to pick it up
            if (refreshClientData) refreshClientData();
        } catch (error) {
            console.error("Error toggling status:", error);
            toast.error(`Failed to ${newStatus === 'active' ? 'activate' : 'disable'} client: ${error.message}`);
        }
        setTogglingStatus(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                {/* This component will now also be protected by the guard clause above */}
                <ClientSubscriptionManager 
                    client={client} 
                    onSubscriptionUpdate={refreshClientData} 
                    allPlans={allPlans} 
                    loadingPlans={loadingPlans} 
                />
            </div>
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <UserSearch className="w-5 h-5 mr-2 text-gray-500" />
                        Admin Actions
                    </h3>

                    <div className="space-y-3">
                        <button
                            onClick={() => onImpersonate(client)}
                            className="w-full px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 flex items-center justify-center"
                        >
                            <Shield className="w-4 h-4 mr-2" /> Impersonate User
                        </button>
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            Log in as this user to troubleshoot issues.
                        </p>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Status:</span>
                            <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {client.status || 'Unknown'}
                            </span>
                        </div>
                        <button
                            onClick={handleToggleStatus}
                            disabled={togglingStatus}
                            className={`w-full px-4 py-2 text-white font-semibold rounded-md flex items-center justify-center transition-colors ${
                                client.status === 'active'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                            } ${togglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Power className="w-4 h-4 mr-2" />
                            {togglingStatus ? 'Processing...' : (client.status === 'active' ? 'Disable Account' : 'Enable Account')}
                        </button>
                         <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                            {client.status === 'active'
                                ? 'Prevents the user from logging in.'
                                : 'Restores user access to the platform.'}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    {/* This component is now protected by the guard clause */}
                    <FeatureFlagManager client={client} />
                </div>
            </div>
        </div>
    );
};

export default ManagementTab;