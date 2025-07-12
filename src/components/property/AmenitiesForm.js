// src/components/property/AmenitiesForm.js
// This component displays the form for selecting property amenities.
// MODIFIED to include a much larger list of amenities and a custom add feature.

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
    Wifi, Tv, Utensils, Droplet, Wind, Building, Sun, CookingPot, Flame, Tent, Bandage, Siren,
    Thermometer, Bath, Dumbbell, Waves, Baby, ToyBrick, Chair, Refrigerator, Microwave, Disc,
    Key, Box, Sparkles, MountainSnow, Sailboat, Plus, Tag
} from 'lucide-react';

// --- EXPANDED AMENITY LIST ---
export const amenityCategories = {
    essentials: {
        title: "Essentials",
        items: {
            wifi: { label: "Wi-Fi", icon: <Wifi size={18} /> },
            tv: { label: "TV", icon: <Tv size={18} /> },
            kitchen: { label: "Kitchen", icon: <Utensils size={18} /> },
            washer: { label: "Washer", icon: <Droplet size={18} /> },
            dryer: { label: "Dryer", icon: <Droplet size={18} /> },
            ac: { label: "Air Conditioning", icon: <Wind size={18} /> },
            heating: { label: "Heating", icon: <Thermometer size={18} /> },
            hotWater: { label: "Hot Water", icon: <Bath size={18} /> },
            workspace: { label: "Dedicated Workspace", icon: <Building size={18} /> },
        }
    },
    features: {
        title: "Standout Features",
        items: {
            pool: { label: "Pool", icon: <Sun size={18} /> },
            hotTub: { label: "Hot Tub", icon: <Waves size={18} /> },
            patio: { label: "Patio", icon: <Tent size={18} /> },
            bbq: { label: "BBQ Grill", icon: <CookingPot size={18} /> },
            firePit: { label: "Fire Pit", icon: <Flame size={18} /> },
            fireplace: { label: "Indoor Fireplace", icon: <Flame size={18} /> },
            gym: { label: "Gym", icon: <Dumbbell size={18} /> },
            sauna: { label: "Sauna", icon: <Waves size={18} /> },
        }
    },
    kitchen: {
        title: "Kitchen & Dining",
        items: {
            refrigerator: { label: "Refrigerator", icon: <Refrigerator size={18} /> },
            microwave: { label: "Microwave", icon: <Microwave size={18} /> },
            dishes: { label: "Dishes & Silverware", icon: <Disc size={18} /> },
            dishwasher: { label: "Dishwasher", icon: <Droplet size={18} /> },
            stove: { label: "Stove", icon: <Flame size={18} /> },
            oven: { label: "Oven", icon: <CookingPot size={18} /> },
            coffeeMaker: { label: "Coffee Maker", icon: <Utensils size={18} /> },
        }
    },
    family: {
        title: "Family",
        items: {
            crib: { label: "Crib", icon: <Baby size={18} /> },
            highChair: { label: "High Chair", icon: <Chair size={18} /> },
            toys: { label: "Toys & Games", icon: <ToyBrick size={18} /> },
            packNPlay: { label: "Pack 'n Play", icon: <Box size={18} /> },
        }
    },
    location: {
        title: "Location Features",
        items: {
            beachAccess: { label: "Beach Access", icon: <Waves size={18} /> },
            lakeAccess: { label: "Lake Access", icon: <Sailboat size={18} /> },
            skiInOut: { label: "Ski-in/Ski-out", icon: <MountainSnow size={18} /> },
        }
    },
    services: {
        title: "Services",
        items: {
            selfCheckIn: { label: "Self check-in", icon: <Key size={18} /> },
            cleaningAvailable: { label: "Cleaning available", icon: <Sparkles size={18} /> },
            luggageDropoff: { label: "Luggage dropoff", icon: <Box size={18} /> },
        }
    },
    safety: {
        title: "Safety Items",
        items: {
            smokeAlarm: { label: "Smoke Alarm", icon: <Siren size={18} /> },
            firstAid: { label: "First Aid Kit", icon: <Bandage size={18} /> },
            fireExtinguisher: { label: "Fire Extinguisher", icon: <Flame size={18} /> },
            carbonMonoxideAlarm: { label: "CO Alarm", icon: <Siren size={18} /> },
        }
    }
};

export const allAmenities = Object.values(amenityCategories).reduce((acc, category) => ({ ...acc, ...category.items }), {});
export const initialAmenitiesState = Object.keys(allAmenities).reduce((acc, key) => ({ ...acc, [key]: false }), {});

export const AmenitiesForm = ({ amenities, setAmenities }) => {
    const [customAmenityInput, setCustomAmenityInput] = useState('');

    const toggleAmenity = (amenityKey) => {
        setAmenities(prev => ({ ...prev, [amenityKey]: !prev[amenityKey] }));
    };

    const handleAddCustomAmenity = () => {
        if (!customAmenityInput.trim()) {
            toast.warn("Please enter a name for the custom amenity.");
            return;
        }
        const formattedInput = customAmenityInput.trim();
        const newKey = `custom_${formattedInput.toLowerCase().replace(/\s+/g, '_')}`;
        
        if (amenities.hasOwnProperty(newKey)) {
            toast.warn(`Amenity "${formattedInput}" already exists.`);
            return;
        }

        setAmenities(prev => ({ ...prev, [newKey]: true }));
        setCustomAmenityInput('');
    };
    
    // Separate predefined from custom for rendering
    const customAmenities = Object.keys(amenities || {}).filter(key => key.startsWith('custom_'));

    return (
        <div className="space-y-6">
            {Object.entries(amenityCategories).map(([categoryKey, category]) => (
                <div key={categoryKey}>
                    <label className="block text-gray-800 dark:text-gray-200 font-semibold mb-3">{category.title}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Object.entries(category.items).map(([key, { label, icon }]) => (
                            <button key={key} type="button" onClick={() => toggleAmenity(key)} className={`flex items-center space-x-3 px-4 py-3 border rounded-lg text-sm font-medium transition-all duration-200 ${amenities[key] ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400'}`}>
                                {icon}
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            
            {/* --- NEW: Custom Amenities Section --- */}
            <div>
                <label className="block text-gray-800 dark:text-gray-200 font-semibold mb-3">Custom Amenities</label>
                <div className="flex items-center gap-2 mb-4">
                    <input
                        type="text"
                        value={customAmenityInput}
                        onChange={(e) => setCustomAmenityInput(e.target.value)}
                        placeholder="e.g., Rooftop Deck"
                        className="input-style flex-grow"
                    />
                    <button type="button" onClick={handleAddCustomAmenity} className="button-primary flex-shrink-0">
                        <Plus size={16} className="mr-1" /> Add
                    </button>
                </div>
                {customAmenities.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {customAmenities.map(key => {
                            const label = key.replace('custom_', '').replace(/_/g, ' ');
                            return (
                                <button key={key} type="button" onClick={() => toggleAmenity(key)} className={`flex items-center space-x-3 px-4 py-3 border rounded-lg text-sm font-medium transition-all duration-200 capitalize ${amenities[key] ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-green-500 hover:text-green-600 dark:hover:border-green-500 dark:hover:text-green-400'}`}>
                                    <Tag size={18} />
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
