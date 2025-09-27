import React from 'react';
import { Building, ChevronRight } from 'lucide-react';

// --- FIX: This component now expects `properties` and `loading` as props ---
const PropertiesTab = ({ properties, loading, onSelectProperty }) => {
    
    // --- FIX: Guard clause to handle loading state ---
    if (loading) {
        return <div>Loading properties...</div>;
    }

    // --- FIX: Guard clause for when there are no properties ---
    if (!properties || properties.length === 0) {
        return (
            <div className="text-center p-8">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No Properties Found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This client does not have any properties assigned yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {properties.map((prop) => (
                    <li key={prop.id} onClick={() => onSelectProperty(prop)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center">
                            <img className="h-16 w-24 rounded-md object-cover mr-4" src={prop.photos?.[0] || 'https://via.placeholder.com/150'} alt={prop.name} />
                            <div>
                                <p className="text-md font-semibold text-gray-900 dark:text-gray-100">{prop.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{prop.address}</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PropertiesTab;