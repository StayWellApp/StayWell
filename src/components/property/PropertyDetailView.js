// src/components/property/PropertyDetailView.js
// This is the main container for viewing the details of a single property.
// MODIFIED to show an image gallery and fix navigation logic.

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Home, CheckSquare, Archive, Calendar, BarChart2, Settings, Image as ImageIcon, Building, Tag } from 'lucide-react';

// Import the refactored components
import { PropertyForm } from './PropertyForm';
import { TasksView } from './PropertyTasksView';
import { CalendarView } from './PropertyCalendarView';
import { AnalyticsView } from './PropertyAnalyticsView';
import { SettingsView } from './PropertySettingsView';
import { ChecklistsView } from './PropertyChecklistsView';
import { InventoryView } from '../InventoryViews'; // Assuming this is in a separate file
import { allAmenities } from './AmenitiesForm';


export const PropertyDetailView = ({ property, onBack, user }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [liveProperty, setLiveProperty] = useState(property);

    useEffect(() => {
        const propertyRef = doc(db, "properties", property.id);
        const unsubscribe = onSnapshot(propertyRef, (doc) => {
            if (doc.exists()) {
                setLiveProperty({ id: doc.id, ...doc.data() });
            } else {
                toast.error("Property data could not be found.");
            }
        }, (error) => {
            console.error("Error fetching live property data:", error);
            toast.error("Could not load live property data.");
        });
        return () => unsubscribe();
    }, [property.id]);

    const handleUpdateProperty = async (propertyData) => {
        const toastId = toast.loading("Updating property...");
        try {
            const propertyRef = doc(db, "properties", property.id);
            await updateDoc(propertyRef, propertyData);
            toast.update(toastId, { 
                render: "Property updated successfully!", 
                type: "success", 
                isLoading: false, 
                autoClose: 3000 
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating property:", error);
            toast.update(toastId, { 
                render: "Failed to update property.", 
                type: "error", 
                isLoading: false, 
                autoClose: 5000 
            });
        }
    };

    const TabButton = ({ tabName, label, icon }) => (
        <button onClick={() => setActiveTab(tabName)} className={`whitespace-nowrap flex items-center space-x-2 px-3 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === tabName ? 'border-blue-500 text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}>
            {icon}
            <span>{label}</span>
        </button>
    );
    
    // --- MODIFIED: Overview component to display custom amenities ---
    const Overview = () => {
        const [mainImage, setMainImage] = useState(liveProperty.mainPhotoURL || (liveProperty.photoURLs && liveProperty.photoURLs[0]) || '');

        useEffect(() => {
            setMainImage(liveProperty.mainPhotoURL || (liveProperty.photoURLs && liveProperty.photoURLs[0]) || '');
        }, [liveProperty]);

        const photoURLs = liveProperty.photoURLs || [];
        
        // --- NEW: Logic to separate and format custom amenities ---
        const propertyAmenities = liveProperty.amenities || {};
        const customAmenitiesToDisplay = Object.entries(propertyAmenities)
            .filter(([key, value]) => key.startsWith('custom_') && value)
            .map(([key]) => ({
                key,
                label: key.replace('custom_', '').replace(/_/g, ' '),
                icon: <Tag size={18} />
            }));


        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Image Gallery Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><ImageIcon size={20} className="mr-2"/> Gallery</h3>
                        <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                            {mainImage ? (
                                <img src={mainImage} alt="Main property view" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Building className="w-24 h-24 text-gray-300 dark:text-gray-500" />
                                </div>
                            )}
                        </div>
                        {photoURLs.length > 1 && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                {photoURLs.map((url, index) => (
                                    <div key={index} className="aspect-square cursor-pointer rounded-md overflow-hidden" onClick={() => setMainImage(url)}>
                                        <img src={url} alt={`Thumbnail ${index + 1}`} className={`w-full h-full object-cover transition-all duration-200 ${mainImage === url ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : 'opacity-70 hover:opacity-100'}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{liveProperty.propertyType}</p>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{liveProperty.propertyName}</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">{liveProperty.address}</p>
                            </div>
                            <button onClick={() => setIsEditing(true)} className="button-secondary flex-shrink-0">Edit</button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-4">{liveProperty.description}</p>
                        
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">What this place offers</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                {/* --- MODIFIED: Render predefined amenities --- */}
                                {Object.entries(allAmenities).map(([key, { label, icon }]) => 
                                    propertyAmenities[key] && (
                                        <div key={key} className="flex items-center text-gray-700 dark:text-gray-300 space-x-3 text-sm">
                                            <div className="text-blue-600 dark:text-blue-400">{icon}</div>
                                            <span>{label}</span>
                                        </div>
                                    )
                                )}
                                {/* --- NEW: Render custom amenities --- */}
                                {customAmenitiesToDisplay.map(({ key, label, icon }) => (
                                    <div key={key} className="flex items-center text-gray-700 dark:text-gray-300 space-x-3 text-sm capitalize">
                                        <div className="text-green-500">{icon}</div>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <button 
                    onClick={() => isEditing ? setIsEditing(false) : onBack()} 
                    className="mb-6 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                    {isEditing ? '← Back to Property Details' : '← Back to All Properties'}
                </button>
                
                {isEditing ? (
                     <PropertyForm existingProperty={liveProperty} onSave={handleUpdateProperty} onCancel={() => setIsEditing(false)} />
                ) : (
                    <>
                        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                            <div className="flex space-x-2 sm:space-x-4 overflow-x-auto">
                                <TabButton tabName="overview" label="Overview" icon={<Home size={18}/>} />
                                <TabButton tabName="tasks" label="Tasks" icon={<CheckSquare size={18}/>} />
                                <TabButton tabName="checklists" label="Templates" icon={<CheckSquare size={18}/>} />
                                <TabButton tabName="inventory" label="Inventory" icon={<Archive size={18}/>} />
                                <TabButton tabName="calendar" label="Calendar" icon={<Calendar size={18}/>} />
                                <TabButton tabName="analytics" label="Analytics" icon={<BarChart2 size={18}/>} />
                                <TabButton tabName="settings" label="Settings" icon={<Settings size={18}/>} />
                            </div>
                        </div>
                        <div>
                            {activeTab === 'overview' && <Overview />}
                            {activeTab === 'tasks' && <TasksView property={liveProperty} user={user} />}
                            {activeTab === 'checklists' && <ChecklistsView user={user} />}
                            {activeTab === 'inventory' && <InventoryView property={liveProperty} user={user} />}
                            {activeTab === 'calendar' && <CalendarView property={liveProperty} user={user} />}
                            {activeTab === 'analytics' && <AnalyticsView property={liveProperty} />}
                            {activeTab === 'settings' && <SettingsView property={liveProperty} />}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
