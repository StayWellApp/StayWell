// src/components/property/PropertyCard.js
// This component is responsible for displaying a summary card for a single property.

import React from 'react';
import { Building, Bed, Bath, Users } from 'lucide-react';

export const PropertyCard = ({ property, onSelect }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col">
        <div className="bg-gray-100 dark:bg-gray-700 h-48 flex items-center justify-center relative">
            {property.photoURL ? (
                <img src={property.photoURL} alt={property.propertyName} className="w-full h-full object-cover" />
            ) : (
                <Building className="text-gray-300 dark:text-gray-500 w-16 h-16" />
            )}
            <div className="absolute top-2 right-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200">{property.propertyType}</div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{property.propertyName}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm truncate flex-grow">{property.address}</p>
            <div className="mt-4 flex justify-around items-center text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center space-x-2"><Users size={16} className="text-gray-500" /><span>{property.guests} Guests</span></div>
                <div className="flex items-center space-x-2"><Bed size={16} className="text-gray-500" /><span>{property.bedrooms} Beds</span></div>
                <div className="flex items-center space-x-2"><Bath size={16} className="text-gray-500" /><span>{property.bathrooms} Baths</span></div>
            </div>
             <button onClick={onSelect} className="mt-5 w-full button-primary">Manage Property</button>
        </div>
    </div>
);
