// --- src/components/PropertiesView.js ---
// Replace the entire contents of this file.

import React, { useState } from 'react';
import { PropertyCard, PropertyForm } from './PropertyViews';
import { Plus } from 'lucide-react';

const PropertiesView = ({ properties, onAddProperty, onSelectProperty }) => {
    const [showAddForm, setShowAddForm] = useState(false);

    const handleSave = (propertyData) => {
        onAddProperty(propertyData);
        setShowAddForm(false);
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Your Properties</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">View, manage, and add your properties below.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                >
                    <Plus size={18} className="mr-2" />
                    Add Property
                </button>
            </div>

            {showAddForm && (
                <PropertyForm
                    onSave={handleSave}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map(property => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        onSelect={() => onSelectProperty(property)}
                    />
                ))}
            </div>
        </div>
    );
};

export default PropertiesView;
