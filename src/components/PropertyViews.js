import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, arrayUnion, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { TaskDetailModal, AddTaskForm } from './TaskViews';
import { ChecklistTemplateForm } from './ChecklistViews';
import { InventoryView } from './InventoryViews';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, Building, Bed, Bath, Users, Wifi, Tv, Wind, Utensils, Sun, Droplet, CookingPot, Flame, Tent, Bandage, Siren, CheckSquare, Calendar, BarChart2, Archive, Settings, Home, ListChecks } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify'; // --- NEW ---

const amenityCategories = {
    essentials: {
        title: "Essentials",
        items: {
            wifi: { label: "Wi-Fi", icon: <Wifi size={18} /> },
            tv: { label: "TV", icon: <Tv size={18} /> },
            kitchen: { label: "Kitchen", icon: <Utensils size={18} /> },
            washer: { label: "Washer", icon: <Droplet size={18} /> },
            ac: { label: "Air Conditioning", icon: <Wind size={18} /> },
            workspace: { label: "Dedicated Workspace", icon: <Building size={18} /> },
        }
    },
    features: {
        title: "Standout Features",
        items: {
            pool: { label: "Pool", icon: <Sun size={18} /> },
            hotTub: { label: "Hot Tub", icon: <Droplet size={18} /> },
            patio: { label: "Patio", icon: <Tent size={18} /> },
            bbq: { label: "BBQ Grill", icon: <CookingPot size={18} /> },
            firePit: { label: "Fire Pit", icon: <Flame size={18} /> },
            fireplace: { label: "Indoor Fireplace", icon: <Flame size={18} /> },
        }
    },
    safety: {
        title: "Safety Items",
        items: {
            smokeAlarm: { label: "Smoke Alarm", icon: <Siren size={18} /> },
            firstAid: { label: "First Aid Kit", icon: <Bandage size={18} /> },
            fireExtinguisher: { label: "Fire Extinguisher", icon: <Flame size={18} /> },
        }
    }
};
const allAmenities = Object.values(amenityCategories).reduce((acc, category) => ({ ...acc, ...category.items }), {});
const initialAmenitiesState = Object.keys(allAmenities).reduce((acc, key) => ({ ...acc, [key]: false }), {});
const propertyTypes = ["House", "Apartment", "Guesthouse", "Hotel", "Cabin", "Barn", "Bed & Breakfast", "Boat", "Camper/RV", "Castle", "Tiny Home", "Treehouse"];

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

export const PropertyForm = ({ onSave, onCancel, existingProperty = null }) => {
    const [propertyName, setPropertyName] = useState('');
    const [propertyType, setPropertyType] = useState(propertyTypes[0]);
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [bedrooms, setBedrooms] = useState(1);
    const [bathrooms, setBathrooms] = useState(1);
    const [guests, setGuests] = useState(2);
    const [amenities, setAmenities] = useState(initialAmenitiesState);
    const [photo, setPhoto] = useState(null);
    const [photoURL, setPhotoURL] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Renamed from isUploading for clarity

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
            setPhotoURL(existingProperty.photoURL || '');
        }
    }, [existingProperty]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPhoto(e.target.files[0]);
            setPhotoURL(URL.createObjectURL(e.target.files[0]));
        }
    };
    
    // --- MODIFIED with Error Handling ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!propertyName || !address) {
            toast.error("Please fill out at least the property name and address.");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading(existingProperty ? "Updating property..." : "Adding property...");

        try {
            let uploadedPhotoURL = existingProperty?.photoURL || '';

            if (photo) {
                const photoRef = ref(storage, `property_photos/${Date.now()}_${photo.name}`);
                await uploadBytes(photoRef, photo);
                uploadedPhotoURL = await getDownloadURL(photoRef);
            }

            const propertyData = {
                propertyName,
                propertyType,
                address,
                description,
                bedrooms,
                bathrooms,
                guests,
                amenities,
                photoURL: uploadedPhotoURL,
            };
            
            await onSave(propertyData);

            toast.update(toastId, { 
                render: `Property ${existingProperty ? 'updated' : 'added'} successfully!`, 
                type: "success", 
                isLoading: false, 
                autoClose: 3000 
            });

        } catch (error) {
            console.error("Error saving property:", error);
            toast.update(toastId, { 
                render: `Failed to save property. Please try again.`, 
                type: "error", 
                isLoading: false, 
                autoClose: 5000 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 animate-fade-in-down">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{existingProperty ? 'Edit Property' : 'Add a New Property'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="propertyName">Property Name</label><input type="text" id="propertyName" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} className="input-style" placeholder="e.g., Downtown Loft" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="propertyType">Property Type</label><select id="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="input-style">{propertyTypes.map(type => <option key={type}>{type}</option>)}</select></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="address">Address</label><input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="input-style" placeholder="e.g., 123 Main St, Anytown" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="description">Description</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="input-style" rows="3" placeholder="A brief description of the property..."></textarea></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="guests">Max Guests</label><input type="number" id="guests" value={guests} min="1" onChange={(e) => setGuests(parseInt(e.target.value))} className="input-style" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="bedrooms">Bedrooms</label><input type="number" id="bedrooms" value={bedrooms} min="0" onChange={(e) => setBedrooms(parseInt(e.target.value))} className="input-style" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="bathrooms">Bathrooms</label><input type="number" id="bathrooms" value={bathrooms} min="1" step="0.5" onChange={(e) => setBathrooms(parseFloat(e.target.value))} className="input-style" /></div>
                </div>
                <AmenitiesForm amenities={amenities} setAmenities={setAmenities} />
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="photo">Main Photo</label>
                    <input type="file" id="photo" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900"/>
                    {photoURL && <img src={photoURL} alt="Property Preview" className="mt-4 w-40 h-40 object-cover rounded-lg shadow-md" />}
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                    <button type="submit" className="button-primary" disabled={isLoading}>
                        {isLoading ? 'Saving...' : (existingProperty ? 'Update Property' : 'Save Property')}
                    </button>
                </div>
            </form>
        </div>
    );
};


const AmenitiesForm = ({ amenities, setAmenities }) => {
    const toggleAmenity = (amenity) => {
        setAmenities(prev => ({ ...prev, [amenity]: !prev[amenity] }));
    };

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
        </div>
    );
};

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

    // --- MODIFIED with Error Handling ---
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
    
    const Overview = () => (
         <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{liveProperty.propertyType}</p>
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-1">{liveProperty.propertyName}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">{liveProperty.address}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="button-secondary">Edit</button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-4">{liveProperty.description}</p>
            
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">What this place offers</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                    {liveProperty.amenities && Object.entries(allAmenities).map(([key, { label, icon }]) => liveProperty.amenities[key] && (
                        <div key={key} className="flex items-center text-gray-700 dark:text-gray-300 space-x-3">
                            <div className="text-blue-600 dark:text-blue-400">{icon}</div>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <button onClick={onBack} className="mb-6 text-blue-600 dark:text-blue-400 font-semibold hover:underline">← Back to Properties</button>
                
                {isEditing && (
                     <PropertyForm existingProperty={liveProperty} onSave={handleUpdateProperty} onCancel={() => setIsEditing(false)} />
                )}

                {!isEditing && (
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
                            {activeTab === 'checklists' && <ChecklistsView property={liveProperty} user={user} />}
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

const TemplateTaskModal = ({ templates, onClose, onAddTask }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    const handleCreateTaskFromTemplate = () => {
        if (!selectedTemplateId) {
            toast.error('Please select a template.');
            return;
        }
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) {
            toast.error('Selected template not found.');
            return;
        }

        const taskData = {
            taskName: template.name,
            taskType: template.taskType || 'Cleaning',
            description: `Task created from template: ${template.name}`,
            priority: 'Medium',
            scheduledDate: '',
            assignedTo: '',
            assignedToEmail: '',
            templateId: template.id,
            templateName: template.name,
            checklistItems: template.items ? template.items.map(item => ({...item, completed: false})) : [],
        };
        
        onAddTask(taskData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Task from Template</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a Template</label>
                        <select
                            value={selectedTemplateId}
                            onChange={e => setSelectedTemplateId(e.target.value)}
                            className="mt-1 w-full input-style"
                        >
                            <option value="">-- Choose a template --</option>
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-6 mt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
                    <button type="button" onClick={handleCreateTaskFromTemplate} className="button-primary">Create Task</button>
                </div>
            </div>
        </div>
    );
};

const TasksView = ({ property, user }) => {
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [team, setTeam] = useState([]);
    const [checklistTemplates, setChecklistTemplates] = useState([]);

    useEffect(() => {
        const tasksQuery = query(collection(db, "tasks"), where("propertyId", "==", property.id));
        const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const sortedTasks = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setTasks(sortedTasks);
            setLoadingTasks(false);
        }, (error) => {
            console.error("Error fetching tasks:", error);
            toast.error("Could not load tasks.");
            setLoadingTasks(false);
        });

        const checklistsQuery = query(collection(db, "checklistTemplates"), where("ownerId", "==", user.uid));
        const checklistsUnsubscribe = onSnapshot(checklistsQuery, (snapshot) => {
            const relevantTemplates = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(template => 
                !template.linkedProperties || 
                template.linkedProperties.length === 0 || 
                template.linkedProperties.includes(property.id)
              );
            setChecklistTemplates(relevantTemplates);
        }, (error) => {
            console.error("Error fetching checklist templates:", error);
            toast.error("Could not load checklist templates.");
        });

        const teamQuery = query(collection(db, 'users'), where('ownerId', '==', user.uid));
        const teamUnsubscribe = onSnapshot(teamQuery, snapshot => {
            setTeam(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        }, (error) => {
            console.error("Error fetching team members:", error);
            toast.error("Could not load team data.");
        });
        
        return () => {
            tasksUnsubscribe();
            checklistsUnsubscribe();
            teamUnsubscribe();
        };
    }, [property.id, user.uid]);

    // --- MODIFIED with Error Handling ---
    const handleAddTask = async (taskData) => {
        const toastId = toast.loading("Adding new task...");
        try {
            await addDoc(collection(db, "tasks"), { 
                ...taskData, 
                propertyId: property.id, 
                propertyName: property.propertyName, 
                propertyAddress: property.address, 
                ownerId: user.uid, 
                status: 'Pending', 
                createdAt: serverTimestamp() 
            });
            toast.update(toastId, { 
                render: "Task added successfully!", 
                type: "success", 
                isLoading: false, 
                autoClose: 3000 
            });
            setShowAddTaskForm(false);
            setShowTemplateModal(false);
        } catch (error) {
            console.error("Error adding task: ", error);
            toast.update(toastId, { 
                render: "Failed to add task.", 
                type: "error", 
                isLoading: false, 
                autoClose: 5000 
            });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Tasks</h3>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setShowTemplateModal(true)} className="button-secondary">
                        <ListChecks size={16} className="mr-2" />
                        Add from Template
                    </button>
                    <button onClick={() => setShowAddTaskForm(true)} className="button-primary">
                        <Plus size={18} className="mr-2" />
                        Add New Task
                    </button>
                </div>
            </div>
            
            {showAddTaskForm && <AddTaskForm onAddTask={handleAddTask} onCancel={() => setShowAddTaskForm(false)} checklistTemplates={checklistTemplates} team={team} />}
            {showTemplateModal && <TemplateTaskModal templates={checklistTemplates} onClose={() => setShowTemplateModal(false)} onAddTask={handleAddTask} />}

            <div className="mt-4 border-t border-gray-200 dark:border-gray-700">
                {loadingTasks ? <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading tasks...</p> : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tasks.length > 0 ? tasks.map(task => (
                            <li key={task.id} onClick={() => setSelectedTask(task)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{task.taskName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{task.taskType} {task.templateName && `- ${task.templateName}`}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{task.assignedToEmail ? `Assigned to: ${task.assignedToEmail}`: 'Unassigned'}</p>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${task.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>{task.status}</span>
                            </li>
                        )) : <p className="text-center py-8 text-gray-500 dark:text-gray-400">No tasks for this property yet.</p>}
                    </ul>
                )}
            </div>
            {selectedTask && <TaskDetailModal task={selectedTask} team={team} checklistTemplates={checklistTemplates} onClose={() => setSelectedTask(null)} />}
        </div>
    );
};

const ChecklistsView = ({ user }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Checklist Templates</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
                Checklist templates are now managed globally. Please use the "Templates" tab in the main navigation sidebar to create, edit, or delete templates for all your properties.
            </p>
        </div>
    );
};


const CalendarView = ({ property, user }) => {
    const [events, setEvents] = useState([]);
    const [newCalLink, setNewCalLink] = useState("");
    
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [team, setTeam] = useState([]);
    const [checklistTemplates, setChecklistTemplates] = useState([]);

    useEffect(() => {
        if (!user) return;
        const checklistsQuery = query(collection(db, "checklistTemplates"), where("ownerId", "==", user.uid));
        const checklistsUnsubscribe = onSnapshot(checklistsQuery, (snapshot) => {
            setChecklistTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching checklist templates for calendar:", error);
            toast.error("Could not load checklist templates.");
        });

        const teamQuery = query(collection(db, 'users'), where('ownerId', '==', user.uid));
        const teamUnsubscribe = onSnapshot(teamQuery, snapshot => {
            setTeam(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        }, (error) => {
            console.error("Error fetching team for calendar:", error);
            toast.error("Could not load team data.");
        });

        return () => {
            checklistsUnsubscribe();
            teamUnsubscribe();
        };
    }, [user]);

    useEffect(() => {
        const bookingEvents = [
            { id: 'booking-001', title: `Guest: John Doe`, start: '2025-07-10T14:00:00', end: '2025-07-15T11:00:00', backgroundColor: '#3b82f6', borderColor: '#2563eb' },
            { id: 'booking-002', title: `Guest: Jane Smith`, start: '2025-07-22', end: '2025-07-28', backgroundColor: '#3b82f6', borderColor: '#2563eb' },
        ];

        const tasksQuery = query(collection(db, "tasks"), where("propertyId", "==", property.id));
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const taskEvents = snapshot.docs.map(doc => {
                const task = doc.data();
                return {
                    id: doc.id,
                    title: `Task: ${task.taskName}`,
                    start: task.scheduledDate,
                    allDay: true,
                    backgroundColor: '#10b981',
                    borderColor: '#059669'
                };
            }).filter(event => event.start);

            setEvents([...bookingEvents, ...taskEvents]);
        }, (error) => {
            console.error("Error fetching tasks for calendar:", error);
            toast.error("Could not load tasks on the calendar.");
        });

        return () => unsubscribe();
    }, [property.id]);

    const handleDateClick = (arg) => {
        setSelectedDate(arg.dateStr);
        setShowAddTaskForm(true);
    };

    // --- MODIFIED with Error Handling ---
    const handleAddTask = async (taskData) => {
        const toastId = toast.loading("Adding task...");
        try {
            await addDoc(collection(db, "tasks"), { 
                ...taskData, 
                propertyId: property.id, 
                propertyName: property.propertyName, 
                propertyAddress: property.address, 
                ownerId: user.uid, 
                status: 'Pending', 
                createdAt: serverTimestamp() 
            });
            toast.update(toastId, { 
                render: "Task added successfully!", 
                type: "success", 
                isLoading: false, 
                autoClose: 3000 
            });
            setShowAddTaskForm(false);
        } catch (error) { 
            console.error("Error adding task: ", error); 
            toast.update(toastId, { 
                render: "Failed to add task.", 
                type: "error", 
                isLoading: false, 
                autoClose: 5000 
            });
        }
    };

    // --- MODIFIED with Error Handling ---
    const handleAddCalendarLink = async (e) => {
        e.preventDefault();
        if (!newCalLink.startsWith("https") || !newCalLink.endsWith(".ics")) {
            toast.error("Please enter a valid iCal link (must start with https and end with .ics).");
            return;
        }
        const toastId = toast.loading("Syncing calendar...");
        try {
            const propertyRef = doc(db, "properties", property.id);
            await updateDoc(propertyRef, { calendarLinks: arrayUnion(newCalLink) });
            toast.update(toastId, { 
                render: "Calendar synced successfully!", 
                type: "success", 
                isLoading: false, 
                autoClose: 3000 
            });
            setNewCalLink("");
        } catch (error) {
            console.error("Error adding calendar link:", error);
            toast.update(toastId, { 
                render: "Failed to sync calendar.", 
                type: "error", 
                isLoading: false, 
                autoClose: 5000 
            });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {showAddTaskForm && (
                <div className="mb-6">
                    <AddTaskForm 
                        onAddTask={handleAddTask} 
                        onCancel={() => setShowAddTaskForm(false)}
                        checklistTemplates={checklistTemplates} 
                        team={team}
                        preselectedDate={selectedDate}
                    />
                     <hr className="my-6 border-gray-200 dark:border-gray-700"/>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Unified Calendar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click a date to add a task, or use the button.</p>
                </div>
                <button 
                    onClick={() => {
                        setSelectedDate(null);
                        setShowAddTaskForm(true);
                    }}
                    className="button-primary"
                >
                    <Plus size={18} className="mr-2" />
                    New Task
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 -m-2 md:p-0 md:m-0">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    editable={false}
                    dayMaxEvents={true}
                    weekends={true}
                    dateClick={handleDateClick}
                />
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Sync Calendars (iCal)</h4>
                <form onSubmit={handleAddCalendarLink} className="flex space-x-2">
                    <input
                        type="url"
                        value={newCalLink}
                        onChange={e => setNewCalLink(e.target.value)}
                        placeholder="Paste iCal link..."
                        className="input-style flex-grow"
                    />
                    <button type="submit" className="button-secondary">Add</button>
                </form>
                <ul className="mt-3 space-y-2">
                    {property.calendarLinks && property.calendarLinks.map((link, index) => (
                        <li key={index} className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border dark:border-gray-700 truncate">{link}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const AnalyticsView = ({ property }) => {
    const data = [
        { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 },
        { name: 'Mar', revenue: 5000 }, { name: 'Apr', revenue: 4500 },
        { name: 'May', revenue: 6000 }, { name: 'Jun', revenue: 5500 },
    ];
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Revenue Analytics</h3>
            <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={data}>
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                    <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }}/>
                    <Tooltip 
                        cursor={{fill: 'rgba(156, 163, 175, 0.1)'}}
                        contentStyle={{ 
                            backgroundColor: 'rgba(31, 41, 55, 0.8)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid #4b5563',
                            borderRadius: '0.75rem'
                        }}
                        labelStyle={{ color: '#d1d5db' }}
                    />
                    <Legend wrapperStyle={{ color: '#9ca3af' }} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
};

const SettingsView = ({ property }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Property Settings</h3>
        <p className="text-gray-600 dark:text-gray-400">Manage settings specific to {property.propertyName}.</p>
    </div>
);
