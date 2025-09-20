// src/components/admin/tabs/ManagementTab.js
import React from 'react';
import ClientSubscriptionManager from '../ClientSubscriptionManager';
import FeatureFlagManager from '../FeatureFlagManager';

const ManagementTab = ({ clientData, refreshClientData, allPlans, loadingPlans, onImpersonate }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
            <ClientSubscriptionManager client={clientData} onSubscriptionUpdate={refreshClientData} allPlans={allPlans} loadingPlans={loadingPlans} />
        </div>
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
                <button onClick={onImpersonate} className="button-secondary w-full">Impersonate User</button>
                <p className="text-xs text-center mt-2 text-gray-500">Log in as this user to troubleshoot.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <FeatureFlagManager client={clientData} />
            </div>
        </div>
    </div>
);

export default ManagementTab;