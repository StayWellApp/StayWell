Of course. Thank you for providing the code. Now I can see exactly what is needed. My apologies again for the previous error; I will be much more careful this time to integrate the new code properly.

Let's do this the right way.

### **Step 1: Install FullCalendar for React**

First, if you haven't already, please open a terminal in your project's root directory (`staywellapp/staywell/StayWell-b55a138a491a147f4b514bf0c48290b41348b3b8/`) and run this command. This adds the calendar library to your project.

```bash
npm install --save @fullcalendar/react @fullcalendar/daygrid
```

### **Step 2: Replace the `PropertyViews.js` File**

Here is the complete, corrected code for your `src/components/PropertyViews.js` file. I have carefully added the new calendar functionality without removing any of your existing work.

Simply copy the entire code block below and replace the contents of your `src/components/PropertyViews.js` file with it.

```javascript
// --- src/components/PropertyViews.js ---
// Replace the entire contents of your PropertyViews.js file with this code.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, arrayUnion, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { TaskDetailModal, AddTaskForm } from './TaskViews';
import { ChecklistTemplateForm } from './ChecklistViews';
import { InventoryView } from './InventoryViews';

// ✨ NEW: Import FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';


// --- (No changes to amenityCategories, allAmenities, initialAmenitiesState, propertyTypes) ---
const amenityCategories = {
    essentials: {
        title: "Essentials",
        items: {
            wifi: { label: "Wi-Fi", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M1.394 8.536a15 15 0 0121.212 0" /> },
            tv: { label: "TV", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
            kitchen: { label: "Kitchen", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
            washer: { label: "Washer", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0115.357-2m0 0H15" /> },
            ac: { label: "Air Conditioning", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /> },
            workspace: { label: "Dedicated Workspace", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
        }
    },
    features: {
        title: "Standout Features",
        items: {
            pool: { label: "Pool", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945C18.055 11 18 10.662 18 10c0-4.418-3.582-8-8-8S2 5.582 2 10c0 .662.055 1 .945 1z" /> },
            hotTub: { label: "Hot Tub", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z" /> },
            patio: { label: "Patio", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /> },
            bbq: { label: "BBQ Grill", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /> },
            firePit: { label: "Fire Pit", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /> },
            fireplace: { label: "Indoor Fireplace", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /> },
        }
    },
    safety: {
        title: "Safety Items",
        items: {
            smokeAlarm: { label: "Smoke Alarm", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
            firstAid: { label: "First Aid Kit", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H9m4 0h2m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /> },
            fireExtinguisher: { label: "Fire Extinguisher", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /> },
        }
    }
};

const allAmenities = Object.values(amenityCategories).reduce((acc, category) => ({ ...acc, ...category.items }), {});
const initialAmenitiesState = Object.keys(allAmenities).reduce((acc, key) => ({ ...acc, [key]: false }), {});

const propertyTypes = ["House", "Apartment", "Guesthouse", "Hotel", "Cabin", "Barn", "Bed & Breakfast", "Boat", "Camper/RV", "Castle", "Tiny Home", "Treehouse"];

// --- (No changes to PropertyCard, PropertyForm, AmenitiesForm) ---
export const PropertyCard = ({ property, onSelect }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
        <div className="bg-gray-200 h-40 flex items-center justify-center"><span className="text-gray-400">Property Photo</span></div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="font-bold text-xl text-gray-800 truncate">{property.propertyName}</h3>
            <p className="text-gray-600 text-sm truncate">{property.address}</p>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-700 border-t pt-3">
                <div className="flex items-center"><svg className="w-5 h-5 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg><span>{property.guests} Guests</span></div>
                <div className="flex items-center"><svg className="w-5 h-5 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M9 21v-2a3 3 0 00-3-3H4a3 3 0 00-3 3v2m15-12V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h7m8-10l-3-3m0 0l-3 3m3-3v12"></path></svg><span>{property.bedrooms} Beds</span></div>
                <div className="flex items-center"><svg className="w-5 h-5 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span>{property.bathrooms} Baths</span></div>
            </div>
             <button onClick={onSelect} className="mt-4 w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">Manage Property</button>
        </div>
    </div>
);

export const PropertyForm = ({ onSave, onCancel, existingProperty = null }) => {
    const [propertyName, setPropertyName] = useState('');
    const [propertyType, setPropertyType] = useState(propertyTypes[0]);
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [bedrooms, setBedrooms] = useState(1);
    const [bathrooms, setBathrooms] = useState(1);
    const [guests, setGuests] = useState(2);
    const [amenities, setAmenities] = useState(initialAmenitiesState);

    useEffect(() => {
        if (existingProperty) {
            setPropertyName(existingProperty.propertyName || '');
            setPropertyType(existingProperty.propertyType || propertyTypes[0]);
            setAddress(existingProperty.address || '');
            setDescription(existingProperty.description || '');
            setBedrooms(existingProperty.bedrooms || 1);
            setBathrooms(existingProperty.bathrooms || 1);
            setGuests(existingProperty.guests || 2);
            setAmenities(existingProperty.amenities || initialAmenitiesState);
        }
    }, [existingProperty]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!propertyName || !address) { alert("Please fill out at least the property name and address."); return; }
        const propertyData = { propertyName, propertyType, address, description, bedrooms, bathrooms, guests, amenities };
        onSave(propertyData);
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6 animate-fade-in-down">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{existingProperty ? 'Edit Property' : 'Add a New Property'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-gray-600 mb-1" htmlFor="propertyName">Property Name</label><input type="text" id="propertyName" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Downtown Loft" /></div>
                    <div><label className="block text-gray-600 mb-1" htmlFor="propertyType">Property Type</label><select id="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">{propertyTypes.map(type => <option key={type}>{type}</option>)}</select></div>
                </div>
                <div><label className="block text-gray-600 mb-1" htmlFor="address">Address</label><input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 123 Main St, Anytown" /></div>
                <div><label className="block text-gray-600 mb-1" htmlFor="description">Description</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="A brief description of the property..."></textarea></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-gray-600 mb-1" htmlFor="guests">Max Guests</label><input type="number" id="guests" value={guests} min="1" onChange={(e) => setGuests(parseInt(e.target.value))} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-gray-600 mb-1" htmlFor="bedrooms">Bedrooms</label><input type="number" id="bedrooms" value={bedrooms} min="0" onChange={(e) => setBedrooms(parseInt(e.target.value))} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-gray-600 mb-1" htmlFor="bathrooms">Bathrooms</label><input type="number" id="bathrooms" value={bathrooms} min="1" step="0.5" onChange={(e) => setBathrooms(parseFloat(e.target.value))} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <AmenitiesForm amenities={amenities} setAmenities={setAmenities} />
                <div><label className="block text-gray-600 mb-1" htmlFor="photo">Main Photo</label><input type="file" id="photo" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/><p className="text-xs text-gray-400 mt-1">Image uploads coming soon!</p></div>
                <div className="flex justify-end space-x-4 pt-4"><button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button><button type="submit" className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">{existingProperty ? 'Update Property' : 'Save Property'}</button></div>
            </form>
        </div>
    );
};

const AmenitiesForm = ({ amenities, setAmenities }) => {
    const toggleAmenity = (amenity) => {
        setAmenities(prev => ({ ...prev, [amenity]: !prev[amenity] }));
    };

    return (
        <div className="space-y-4">
            {Object.entries(amenityCategories).map(([categoryKey, category]) => (
                <div key={categoryKey}>
                    <label className="block text-gray-800 font-semibold mb-2">{category.title}</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {Object.entries(category.items).map(([key, { label, icon }]) => (
                            <button key={key} type="button" onClick={() => toggleAmenity(key)} className={`flex items-center space-x-2 px-3 py-2 border rounded-lg text-sm transition-colors ${amenities[key] ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- (No changes to PropertyDetailView) ---
export const PropertyDetailView = ({ property, onBack, user }) => {
    const [view, setView] = useState('tasks');
    const [isEditing, setIsEditing] = useState(false);

    const handleUpdateProperty = async (propertyData) => {
        try {
            const propertyRef = doc(db, "properties", property.id);
            await updateDoc(propertyRef, propertyData);
            setIsEditing(false);
        } catch (error) { console.error("Error updating property:", error); alert("Failed to update property."); }
    };

    const TabButton = ({ tabName, label }) => (
        <button onClick={() => setView(tabName)} className={`px-4 py-2 text-lg font-semibold ${view === tabName ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            {label}
        </button>
    );

    return (
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg">
            <button onClick={onBack} className="mb-6 text-blue-600 hover:underline">← Back to All Properties</button>
            
            {isEditing ? (
                <PropertyForm existingProperty={property} onSave={handleUpdateProperty} onCancel={() => setIsEditing(false)} />
            ) : (
                <>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase">{property.propertyType}</p>
                            <h2 className="text-3xl font-bold text-gray-800">{property.propertyName}</h2>
                            <p className="text-gray-500 mb-6">{property.address}</p>
                        </div>
                        <button onClick={() => setIsEditing(true)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">Edit</button>
                    </div>
                    <p className="text-gray-600 mb-6">{property.description}</p>
                    
                    <div className="border-t pt-6">
                        <h3 className="text-2xl font-semibold text-gray-700 mb-4">What this place offers</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {property.amenities && Object.entries(allAmenities).map(([key, { label, icon }]) => property.amenities[key] && (
                                <div key={key} className="flex items-center text-gray-700">
                                    <svg className="w-6 h-6 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div className="mt-8 border-t pt-4">
                <div className="flex border-b mb-6 overflow-x-auto">
                    <TabButton tabName="tasks" label="Tasks" />
                    <TabButton tabName="checklists" label="Cleaning Templates" />
                    <TabButton tabName="inventory" label="Inventory" />
                    <TabButton tabName="calendar" label="Calendar" />
                    <TabButton tabName="analytics" label="Analytics" />
                </div>
                {view === 'tasks' && <TasksView property={property} user={user} />}
                {view === 'checklists' && <ChecklistsView property={property} user={user} />}
                {view === 'inventory' && <InventoryView property={property} user={user} />}
                {view === 'calendar' && <CalendarView property={property} />}
                {view === 'analytics' && <AnalyticsView property={property} />}
            </div>
        </div>
    );
};

// --- (No changes to TasksView) ---
const TasksView = ({ property, user }) => {
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [team, setTeam] = useState([]);
    const [checklistTemplates, setChecklistTemplates] = useState([]);

    useEffect(() => {
        const tasksQuery = query(collection(db, "tasks"), where("propertyId", "==", property.id));
        const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingTasks(false);
        });

        const checklistsQuery = query(collection(db, "checklistTemplates"), where("ownerId", "==", user.uid));
        const checklistsUnsubscribe = onSnapshot(checklistsQuery, (snapshot) => {
            setChecklistTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const teamQuery = query(collection(db, 'users'), where('ownerId', '==', user.uid));
        const teamUnsubscribe = onSnapshot(teamQuery, snapshot => {
            setTeam(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        
        return () => {
            tasksUnsubscribe();
            checklistsUnsubscribe();
            teamUnsubscribe();
        };
    }, [property.id, user.uid]);

    const handleAddTask = async (taskData) => {
        try {
            await addDoc(collection(db, "tasks"), { ...taskData, propertyId: property.id, propertyName: property.propertyName, propertyAddress: property.address, ownerId: user.uid, status: 'Pending', createdAt: serverTimestamp() });
            setShowAddTaskForm(false);
        } catch (error) { console.error("Error adding task: ", error); alert("Failed to add task."); }
    };

    return (
        <div>
            <div className="flex justify-end items-center mb-4"><button onClick={() => setShowAddTaskForm(!showAddTaskForm)} className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-sm">{showAddTaskForm ? 'Cancel' : '+ Add Task'}</button></div>
            {showAddTaskForm && <AddTaskForm onAddTask={handleAddTask} checklistTemplates={checklistTemplates} team={team} />}
            {loadingTasks ? <p>Loading tasks...</p> : (
                <ul className="space-y-3 mt-4">
                    {tasks.length > 0 ? tasks.map(task => (
                        <li key={task.id} onClick={() => setSelectedTask(task)} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100">
                            <div>
                                <p className="font-semibold text-gray-800">{task.taskName}</p>
                                <p className="text-sm text-gray-500">{task.taskType} {task.templateName && `- ${task.templateName}`}</p>
                                <p className="text-xs text-blue-500 mt-1">{task.assignedToEmail ? `Assigned to: ${task.assignedToEmail}`: 'Unassigned'}</p>
                            </div>
                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{task.status}</span>
                        </li>
                    )) : <p className="text-gray-500">No tasks for this property yet.</p>}
                </ul>
            )}
            {selectedTask && <TaskDetailModal task={selectedTask} team={team} checklistTemplates={checklistTemplates} onClose={() => setSelectedTask(null)} />}
        </div>
    );
};

// --- (No changes to ChecklistsView) ---
const ChecklistsView = ({ user }) => {
    const [checklistTemplates, setChecklistTemplates] = useState([]);
    const [showChecklistForm, setShowChecklistForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "checklistTemplates"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setChecklistTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [user.uid]);

    const handleSaveChecklist = async (templateData) => {
        try {
            if (editingTemplate) {
                const templateRef = doc(db, "checklistTemplates", editingTemplate.id);
                await updateDoc(templateRef, templateData);
                setEditingTemplate(null);
            } else {
                await addDoc(collection(db, "checklistTemplates"), { ...templateData, ownerId: user.uid, createdAt: serverTimestamp() });
            }
            setShowChecklistForm(false);
        } catch (error) { console.error("Error saving checklist template:", error); alert("Failed to save checklist."); }
    };

    const handleDeleteChecklist = async (templateId) => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            try {
                await deleteDoc(doc(db, "checklistTemplates", templateId));
            } catch (error) {
                console.error("Error deleting checklist template:", error);
                alert("Failed to delete template.");
            }
        }
    };
    
    return (
        <div>
            <div className="flex justify-end items-center mb-4"><button onClick={() => { setEditingTemplate(null); setShowChecklistForm(true); }} className="w-full md:w-auto bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors">Create New Template</button></div>
            {showChecklistForm && <ChecklistTemplateForm onSave={handleSaveChecklist} onCancel={() => setShowChecklistForm(false)} existingTemplate={editingTemplate} />}
            <ul className="space-y-2">
                {checklistTemplates.map(template => (
                    <li key={template.id} className="bg-white p-3 rounded-md border flex justify-between items-center">
                        <span className="text-sm text-gray-700">{template.name} ({template.items.length} items)</span>
                        <div className="space-x-2">
                            <button onClick={() => { setEditingTemplate(template); setShowChecklistForm(true); }} className="text-xs text-blue-500 hover:underline">Edit</button>
                            <button onClick={() => handleDeleteChecklist(template.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// --- ✨ UPDATED CalendarView Component ---
const CalendarView = ({ property }) => {
    // --- MOCK BOOKING DATA ---
    // In the future, we will fetch this data from our iCal links.
    const bookings = [
        {
            id: 'booking-001',
            title: `Guest: John Doe`,
            start: '2025-07-10',
            end: '2025-07-15',
            backgroundColor: '#3b82f6', // blue-500
            borderColor: '#2563eb'      // blue-600
        },
        {
            id: 'booking-002',
            title: `Guest: Jane Smith`,
            start: '2025-07-22',
            end: '2025-07-28',
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb'
        },
        {
            id: 'booking-003',
            title: `Guest: Sam Wilson`,
            start: '2025-08-01',
            end: '2025-08-04',
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb'
        }
    ];

    // Placeholder state and handler for the iCal sync form
    const [newCalLink, setNewCalLink] = useState("");
    const handleAddCalendarLink = async (e) => {
        e.preventDefault();
        if (!newCalLink.startsWith("https") || !newCalLink.endsWith(".ics")) { alert("Please enter a valid iCal link (should start with https and end with .ics)."); return; }
        try {
            const propertyRef = doc(db, "properties", property.id);
            await updateDoc(propertyRef, { calendarLinks: arrayUnion(newCalLink) });
            setNewCalLink("");
        } catch (error) { console.error("Error adding calendar link:", error); alert("Failed to add calendar link."); }
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Booking Calendar</h3>
            
            {/* The FullCalendar Component */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
                <FullCalendar
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth' // Keeping it simple for now
                    }}
                    events={bookings} // Using our mock data
                    editable={false}
                    dayMaxEvents={true}
                    weekends={true}
                />
            </div>

            {/* The iCal Sync Section */}
            <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-600 mb-2">Sync Calendars (iCal)</h4>
                <form onSubmit={handleAddCalendarLink} className="flex space-x-2">
                    <input type="url" value={newCalLink} onChange={e => setNewCalLink(e.target.value)} placeholder="Paste iCal link..." className="flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    <button type="submit" className="bg-blue-500 text-white px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm">Add</button>
                </form>
                <ul className="mt-3 space-y-2">
                    {property.calendarLinks && property.calendarLinks.map((link, index) => (
                        <li key={index} className="text-xs text-gray-500 bg-white p-2 rounded border truncate">{link}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


// --- (No changes to AnalyticsView) ---
const AnalyticsView = ({ property }) => {
    const [consumables, setConsumables] = useState([]);
    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        const consumablesRef = collection(db, 'properties', property.id, 'consumables');
        const unsubscribe = onSnapshot(consumablesRef, (snapshot) => {
            const items = snapshot.docs.map(doc => doc.data());
            setConsumables(items);
            
            const cost = items.reduce((sum, item) => {
                const price = parseFloat(item.purchasePrice) || 0;
                const par = parseInt(item.parLevel) || 0;
                return sum + (price * par);
            }, 0);
            setTotalCost(cost);
        });
        return unsubscribe;
    }, [property.id]);

    return (
        <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Cost Analytics</h3>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="text-lg font-medium text-gray-500">Estimated Cost Per Turnover</h4>
                <p className="text-4xl font-bold text-gray-800 mt-2">${totalCost.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Based on the 'Par Level' of your guest consumables.</p>
            </div>
        </div>
    );
};
```