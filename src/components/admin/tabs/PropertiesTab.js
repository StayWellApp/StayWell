// src/components/admin/tabs/PropertiesTab.js
import React from 'react';
import { toast } from 'react-toastify';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const PropertiesTab = ({ properties, loading, onSelectProperty }) => {
    const handleManageProperty = (property) => {
        console.log("Navigate to manage property:", property.id);
        toast.info(`Navigating to manage property: ${property.name || property.id}`);
        onSelectProperty(property);
    };

    if (loading) {
        return <p className="text-center text-gray-500 dark:text-gray-400">Loading properties...</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700">
                <div className="relative w-full max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MagnifyingGlassIcon className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" placeholder="Search properties..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50"/>
                </div>
                <div><button className="button-secondary">Filter</button></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map(prop => (
                    <div key={prop.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 flex flex-col justify-between overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold">{prop.name || 'Unnamed Property'}</h3>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${prop.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{prop.status || 'Unknown'}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{prop.address || 'No address'}</p>
                            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Next Booking</p>
                                    <p className="font-medium">{prop.nextBooking || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Avg. Nightly Rate</p>
                                    <p className="font-medium">${(prop.avgNightlyRate || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3">
                            <button onClick={() => handleManageProperty(prop)} className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                                Manage Property &rarr;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {properties.length === 0 && <p className="text-center text-gray-500 py-10">No properties found for this client.</p>}
        </div>
    );
};

export default PropertiesTab;