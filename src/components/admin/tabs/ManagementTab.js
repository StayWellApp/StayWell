import React from 'react';
import ClientSubscriptionManager from '../ClientSubscriptionManager';
import FeatureFlagManager from '../FeatureFlagManager';
import { UserSearch } from 'lucide-react'; // Using a relevant icon

// --- FIX: The component now expects `client` directly and other necessary props ---
const ManagementTab = ({ client, refreshClientData, allPlans, loadingPlans, onImpersonate }) => {
    
    // --- FIX: Guard clause to prevent rendering without client data ---
    if (!client) {
        return <div>Loading management details...</div>;
    }

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
                    <button 
                        onClick={() => onImpersonate(client)} 
                        className="w-full px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600"
                    >
                        Impersonate User
                    </button>
                    <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                        Log in as this user to troubleshoot issues.
                    </p>
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