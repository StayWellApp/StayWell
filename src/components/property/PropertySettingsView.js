// src/components/property/PropertySettingsView.js
// This component is a placeholder for property-specific settings.

import React from 'react';

export const SettingsView = ({ property }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Property Settings</h3>
        <p className="text-gray-600 dark:text-gray-400">Manage settings specific to {property.propertyName}.</p>
    </div>
);
