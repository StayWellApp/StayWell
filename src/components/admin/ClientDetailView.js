import React from 'react';
import { ArrowLeft } from 'lucide-react';

const ClientDetailView = ({ client, onBack }) => {
    if (!client) return null;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in">
            <button onClick={onBack} className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6">
                <ArrowLeft size={14} className="mr-2" />
                Back to Client List
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{client.companyName}</h2>
            
            <div className="space-y-4">
                <p><strong className="font-medium text-gray-600 dark:text-gray-400">Client ID:</strong> {client.id}</p>
                <p><strong className="font-medium text-gray-600 dark:text-gray-400">Contact Email:</strong> {client.email}</p>
                {/* More details will be added here */}
            </div>

            <div className="mt-8 border-t dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Admin Actions</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Feature flags, license management, and impersonation tools will go here.</p>
            </div>
        </div>
    );
};

export default ClientDetailView;