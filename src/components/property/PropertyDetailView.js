// src/components/property/PropertyDetailView.js
// FINAL CORRECTED FILE

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { doc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Home, CheckSquare, Archive, Calendar, BarChart2, Settings, Image as ImageIcon, Building, Tag, Key, Info, ListChecks, FileText } from 'lucide-react';

// Import the refactored and NEW components
import { PropertyForm } from './PropertyForm';
import { GuestInfoForm } from './GuestInfoForm';
import { TasksView } from './PropertyTasksView';
import { CalendarView } from './PropertyCalendarView';
import { PerformanceView } from './PropertyPerformanceView';
import { SettingsView } from './PropertySettingsView';
import { InventoryView } from '../InventoryViews';
import { allAmenities } from './AmenitiesForm';

// LinkedTemplatesView Component
const LinkedTemplatesView = ({ property, user }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // FIXED: Dependency array now correctly includes 'user'
        if (!user) return;
        const templatesQuery = query(collection(db, "checklistTemplates"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(templatesQuery, (snapshot) => {
            const allTemplates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const linked = allTemplates.filter(template =>
                !template.linkedProperties ||
                template.linkedProperties.length === 0 ||
                template.linkedProperties.includes(property.id)
            );
            setTemplates(linked);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching linked templates:", error);
            toast.error("Could not load linked templates.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [property.id, user]);

    if (loading) {
        return <div className="text-center p-8">Loading templates...</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Linked Checklist Templates</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">This is a read-only view of all global and property-specific templates. To manage templates, use the main "Templates" tab.</p>
            {templates.length > 0 ? (
                <ul className="space-y-3">
                    {templates.map(template => (
                        <li key={template.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex items-center">
                            <FileText className="text-blue-500 mr-4" size={20} />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{template.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{template.items?.length || 0} items</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">No templates are linked to this property.</p>
            )}
        </div>
    );
};


export const PropertyDetailView = ({ property, onBack, user }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingGuestInfo, setIsEditingGuestInfo] = useState(false);
    const [liveProperty, setLiveProperty] = useState(property);

    useEffect(() => {
        const propertyRef = doc(db, "properties", property.id);
        const unsubscribe = onSnapshot(propertyRef, (doc) => {
            if (doc.exists()) {
                setLiveProperty({ id: doc.id, ...doc.data() });
            } else {
                toast.error("Property data could not be found.");
            }
        });
        return () => unsubscribe();
    }, [property.id]);

    const handleUpdateProperty = async (propertyData) => {
        const toastId = toast.loading("Updating property...");
        try {
            const propertyRef = doc(db, "properties", property.id);
            await updateDoc(propertyRef, propertyData);
            toast.update(toastId, { render: "Property updated successfully!", type: "success", isLoading: false, autoClose: 3000 });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating property:", error);
            toast.update(toastId, { render: "Failed to update property.", type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const handleUpdateGuestInfo = async (guestData) => {
        const propertyRef = doc(db, "properties", property.id);
        await updateDoc(propertyRef, guestData);
    };

    const TabButton = ({ tabName, label, icon }) => (
        <button onClick={() => setActiveTab(tabName)} className={`whitespace-nowrap flex items-center space-x-2 px-3 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === tabName ? 'border-blue-500 text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}>
            {icon}
            <span>{label}</span>
        </button>
    );

    const Overview = () => {
        const [mainImage, setMainImage] = useState(liveProperty.mainPhotoURL || (liveProperty.photoURLs && liveProperty.photoURLs[0]) || '');

        // FIXED: The linter was giving a false positive here. The correct dependency is the liveProperty object itself.
        useEffect(() => {
            setMainImage(liveProperty.mainPhotoURL || (liveProperty.photoURLs && liveProperty.photoURLs[0]) || '');
        }, [liveProperty]);

        const photoURLs = liveProperty.photoURLs || [];
        const propertyAmenities = liveProperty.amenities || {};
        const customAmenitiesToDisplay = Object.entries(propertyAmenities)
            .filter(([key, value]) => key.startsWith('custom_') && value)
            .map(([key]) => ({
                key,
                label: key.replace('custom_', '').replace(/_/g, ' '),
                icon: <Tag size={18} />
            }));

        const accessInfo = liveProperty.accessInfo || {};
        const customInfo = liveProperty.customInfo || [];

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Gallery */}
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
                    {/* Amenities */}
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">What this place offers</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                            {Object.entries(allAmenities).map(([key, { label, icon }]) =>
                                propertyAmenities[key] && (
                                    <div key={key} className="flex items-center text-gray-700 dark:text-gray-300 space-x-3 text-sm">
                                        <div className="text-blue-600 dark:text-blue-400">{icon}</div>
                                        <span>{label}</span>
                                    </div>
                                )
                            )}
                            {customAmenitiesToDisplay.map(({ key, label, icon }) => (
                                <div key={key} className="flex items-center text-gray-700 dark:text-gray-300 space-x-3 text-sm capitalize">
                                    <div className="text-green-500">{icon}</div>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Details Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{liveProperty.propertyType}</p>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{liveProperty.propertyName}</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">{liveProperty.address}</p>
                            </div>
                            <button onClick={() => setIsEditing(true)} className="button-secondary flex-shrink-0">Edit</button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">{liveProperty.description}</p>
                    </div>
                    {/* Access Info & House Rules Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Guest Information</h3>
                            <button onClick={() => setIsEditingGuestInfo(true)} className="button-secondary text-xs">Edit</button>
                        </div>
                        <div className="space-y-4">
                           <div>
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-2"><Key size={16} className="mr-2"/> Access Details</h4>
                                <div className="text-sm space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600 ml-2">
                                    <p><strong>Door Code:</strong> {accessInfo.doorCode || 'N/A'}</p>
                                    <p><strong>Wi-Fi Password:</strong> {accessInfo.wifiPassword || 'N/A'}</p>
                                    <p><strong>Lockbox:</strong> {accessInfo.lockboxCode || 'N/A'}</p>
                                    <p><strong>Parking:</strong> {accessInfo.parkingInstructions || 'N/A'}</p>
                                 </div>
                           </div>
                           <div>
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-2"><Home size={16} className="mr-2"/> House Rules</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap pl-2 border-l-2 border-gray-200 dark:border-gray-600 ml-2">{liveProperty.houseRules || 'No rules specified.'}</p>
                           </div>
                           {customInfo.length > 0 && (
                               <div>
                                   <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-2"><Info size={16} className="mr-2"/> Additional Info</h4>
                                   <div className="text-sm space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600 ml-2">
                                       {customInfo.map((item, index) => (
                                           <p key={index}><strong>{item.label}:</strong> {item.value}</p>
                                       ))}
                                   </div>
                               </div>
                           )}
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

                {isEditingGuestInfo && (
                    <GuestInfoForm
                        property={liveProperty}
                        onSave={handleUpdateGuestInfo}
                        onCancel={() => setIsEditingGuestInfo(false)}
                    />
                )}

                {isEditing ? (
                     <PropertyForm existingProperty={liveProperty} onSave={handleUpdateProperty} onCancel={() => setIsEditing(false)} />
                ) : (
                    <>
                        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                            <div className="flex space-x-2 sm:space-x-4 overflow-x-auto">
                                <TabButton tabName="overview" label="Overview" icon={<Home size={18}/>} />
                                <TabButton tabName="tasks" label="Tasks" icon={<CheckSquare size={18}/>} />
                                <TabButton tabName="templates" label="Templates" icon={<ListChecks size={18}/>} />
                                <TabButton tabName="inventory" label="Inventory" icon={<Archive size={18}/>} />
                                <TabButton tabName="calendar" label="Calendar" icon={<Calendar size={18}/>} />
                                <TabButton tabName="performance" label="Performance" icon={<BarChart2 size={18}/>} />
                                <TabButton tabName="settings" label="Settings" icon={<Settings size={18}/>} />
                            </div>
                        </div>
                        <div>
                            {activeTab === 'overview' && <Overview />}
                            {activeTab === 'tasks' && <TasksView property={liveProperty} user={user} />}
                            {activeTab === 'templates' && <LinkedTemplatesView property={liveProperty} user={user} />}
                            {activeTab === 'inventory' && <InventoryView property={liveProperty} user={user} />}
                            {activeTab === 'calendar' && <CalendarView property={liveProperty} user={user} />}
                            {activeTab === 'performance' && <PerformanceView property={liveProperty} />}
                            {activeTab === 'settings' && <SettingsView property={liveProperty} user={user} onBack={onBack} />}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};