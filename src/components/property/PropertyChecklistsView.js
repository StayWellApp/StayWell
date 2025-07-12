// src/components/property/PropertyChecklistsView.js
// This component is a placeholder for property-specific checklist templates.

import React from 'react';

export const ChecklistsView = ({ user }) => {
    // This component is now managed globally from the main sidebar, 
    // so we can show a read-only view here or a link to the main manager.
    // For now, we'll just show a message.
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Checklist Templates</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
                Checklist templates are now managed globally. Please use the "Templates" tab in the main navigation sidebar to create, edit, or delete templates for all your properties.
            </p>
        </div>
    );
};
