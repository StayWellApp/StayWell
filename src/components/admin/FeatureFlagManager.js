import React, { useState } from 'react';
import { db } from '../../firebase-config';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

// Define your available feature flags here
const ALL_FEATURES = [
    { id: 'advancedAnalytics', label: 'Enable Advanced Analytics' },
    { id: 'apiAccess', label: 'Enable API Access' },
    { id: 'automationModule', label: 'Enable Automation Module' },
];

const FeatureFlagManager = ({ client }) => {
    // Initialize state from the client's data, or with defaults if not present
    const [flags, setFlags] = useState(client.featureFlags || {});

    const handleFlagChange = async (flagId) => {
        const newFlags = { ...flags, [flagId]: !flags[flagId] };
        setFlags(newFlags);

        const toastId = toast.loading("Updating feature flags...");
        try {
            const clientDocRef = doc(db, 'users', client.id);
            await updateDoc(clientDocRef, {
                featureFlags: newFlags
            });
            toast.update(toastId, { render: "Flags updated successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Error updating feature flags:", error);
            toast.update(toastId, { render: "Failed to update flags.", type: "error", isLoading: false, autoClose: 5000 });
            // Revert state on error
            setFlags(client.featureFlags || {});
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Feature Flags</h3>
            <div className="space-y-3">
                {ALL_FEATURES.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!flags[feature.id]}
                                onChange={() => handleFlagChange(feature.id)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeatureFlagManager;