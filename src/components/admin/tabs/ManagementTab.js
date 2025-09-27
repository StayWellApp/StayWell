import React from 'react';
import FeatureFlagManager from '../FeatureFlagManager'; // Assuming this component exists

const ManagementTab = ({ client }) => {
    
    // --- FIX: Guard clause to ensure client data is present ---
    if (!client) {
        return <div>Loading management details...</div>;
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Client Management</h2>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold mb-3">Feature Flags</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Enable or disable specific features for this client.
                </p>
                {/* This will now only render when client data is available */}
                <FeatureFlagManager client={client} />
            </div>

            {/* You can add other management components here */}
        </div>
    );
};

export default ManagementTab;