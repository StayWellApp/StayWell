// --- src/components/PropertiesView.js ---

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
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Your Properties</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">View, manage, and add your properties below.</p>
                </div>
                <button onClick={() => setShowAddForm(true)} className="button-primary">
                    <Plus size={18} className="-ml-1 mr-2" />
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