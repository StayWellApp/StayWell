// --- src/components/StorageViews.js ---
// This is the complete, corrected code with dark mode styles and bug fixes.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Plus, Edit, Trash2 } from 'lucide-react';

// --- Sample Data for Pre-generation ---
const sampleData = {
    supplies: [
        { name: 'Toilet Paper (Bulk)', parLevel: 12, currentStock: 24 },
        { name: 'Paper Towels (Bulk)', parLevel: 6, currentStock: 12 },
        { name: 'All-Purpose Cleaner', parLevel: 1, currentStock: 2 },
        { name: 'Trash Bags', parLevel: 20, currentStock: 50 },
    ]
};

export const StorageView = ({ user }) => {
    const [storageLocations, setStorageLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [selectedLocationId, setSelectedLocationId] = useState(null);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "storageLocations"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const locations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStorageLocations(locations);
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    const handleSaveLocation = async (locationName) => {
        if (!locationName.trim()) return;
        if (editingLocation) {
            const locationRef = doc(db, 'storageLocations', editingLocation.id);
            await updateDoc(locationRef, { name: locationName });
        } else {
            await addDoc(collection(db, 'storageLocations'), {
                name: locationName,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
                linkedProperties: []
            });
        }
        setShowAddForm(false);
        setEditingLocation(null);
    };

    const handleDeleteLocation = async (locationId) => {
        if (window.confirm("Are you sure you want to delete this storage location? This cannot be undone.")) {
            await deleteDoc(doc(db, 'storageLocations', locationId));
        }
    };
    
    const selectedLocation = storageLocations.find(loc => loc.id === selectedLocationId);

    if (selectedLocation) {
        return <StorageLocationDetailView location={selectedLocation} onBack={() => setSelectedLocationId(null)} user={user} />;
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Storage Locations</h1>
                <button onClick={() => { setEditingLocation(null); setShowAddForm(!showAddForm); }} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                    {showAddForm && !editingLocation ? 'Cancel' : <><Plus size={18} className="mr-2" /> Add Storage</>}
                </button>
            </div>

            {showAddForm && <StorageLocationForm onSave={handleSaveLocation} onCancel={() => { setShowAddForm(false); setEditingLocation(null); }} existingLocation={editingLocation} />}

            <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                {loading ? <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</p> : storageLocations.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {storageLocations.map(location => (
                            <li key={location.id} className="p-4 flex justify-between items-center">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{location.name}</p>
                                <div className="space-x-4">
                                    <button onClick={() => setSelectedLocationId(location.id)} className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline">Manage Inventory</button>
                                    <button onClick={() => { setEditingLocation(location); setShowAddForm(true); }} className="font-semibold text-sm text-gray-600 dark:text-gray-400 hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteLocation(location.id)} className="font-semibold text-sm text-red-600 dark:text-red-400 hover:underline">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">You haven't created any storage locations yet.</p>
                )}
            </div>
        </div>
    );
};

const StorageLocationForm = ({ onSave, onCancel, existingLocation }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        setName(existingLocation ? existingLocation.name : '');
    }, [existingLocation]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(name);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 animate-fade-in-down">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{existingLocation ? 'Edit Storage Location' : 'Add New Storage Location'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="location-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location Name</label>
                    <input id="location-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Main Building Closet" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">Save Location</button>
                </div>
            </form>
        </div>
    );
};

const StorageLocationDetailView = ({ location, onBack, user }) => {
    const [showLinkManager, setShowLinkManager] = useState(false);
    const [linkedProperties, setLinkedProperties] = useState([]);

    useEffect(() => {
        if (!location.linkedProperties || location.linkedProperties.length === 0) {
            setLinkedProperties([]);
            return;
        }
        const q = query(collection(db, 'properties'), where('__name__', 'in', location.linkedProperties));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLinkedProperties(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        return unsubscribe;
    }, [location]);

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <button onClick={onBack} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4">← Back to All Storage Locations</button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">{location.name}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <InventorySection 
                        title="Stored Supplies"
                        collectionName={`storageLocations/${location.id}/supplies`}
                        property={{id: location.id}} // Pass a mock property object
                        user={user}
                        sampleItems={sampleData.supplies}
                        fields={{ name: 'text', parLevel: 'number', currentStock: 'number' }}
                        placeholders={{name: "Supply Name (e.g., Toilet Paper Rolls)", parLevel: "Re-order at (e.g., 10)", currentStock: "Current Stock (e.g., 50)"}}
                        displayLogic={(item) => (
                            <div className="flex items-center space-x-4">
                                <div className={`w-3 h-3 rounded-full ${parseInt(item.currentStock) < parseInt(item.parLevel) ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <span className="text-gray-600 dark:text-gray-300">Stock: {item.currentStock || 0} / {item.parLevel || 0}</span>
                            </div>
                        )}
                    />
                </div>
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Linked Properties</h3>
                        <button onClick={() => setShowLinkManager(true)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">Manage</button>
                    </div>
                    <ul className="space-y-2">
                        {linkedProperties.map(prop => (
                            <li key={prop.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md border dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200">{prop.propertyName}</li>
                        ))}
                        {linkedProperties.length === 0 && <p className="text-sm text-center py-4 text-gray-500 dark:text-gray-400">No properties linked yet.</p>}
                    </ul>
                </div>
            </div>
            {showLinkManager && <LinkPropertiesModal location={location} user={user} onClose={() => setShowLinkManager(false)} />}
        </div>
    );
};

const LinkPropertiesModal = ({ location, user, onClose }) => {
    const [allProperties, setAllProperties] = useState([]);
    const [linkedIds, setLinkedIds] = useState(location.linkedProperties || []);

    useEffect(() => {
        // This listener ensures the local state `linkedIds` is always in sync with Firestore
        const unsub = onSnapshot(doc(db, "storageLocations", location.id), (doc) => {
            setLinkedIds(doc.data()?.linkedProperties || []);
        });
        return unsub;
    }, [location.id]);

    useEffect(() => {
        const q = query(collection(db, 'properties'), where('ownerId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAllProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [user.uid]);

    const handleToggleLink = async (propertyId) => {
        const locationRef = doc(db, 'storageLocations', location.id);
        // Use Firestore's atomic array operators to prevent race conditions
        if (linkedIds.includes(propertyId)) {
            await updateDoc(locationRef, {
                linkedProperties: arrayRemove(propertyId)
            });
        } else {
            await updateDoc(locationRef, {
                linkedProperties: arrayUnion(propertyId)
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Link Properties to {location.name}</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto p-1">
                    {allProperties.map(prop => (
                        <div key={prop.id} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            <input 
                                type="checkbox"
                                id={`link-${prop.id}`}
                                checked={linkedIds.includes(prop.id)}
                                onChange={() => handleToggleLink(prop.id)}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 bg-gray-100 dark:bg-gray-900 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                            />
                            <label htmlFor={`link-${prop.id}`} className="ml-3 block text-sm font-medium text-gray-900 dark:text-gray-300">{prop.propertyName}</label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Done</button>
                </div>
            </div>
        </div>
    );
};

// This is a local version of the InventorySection component, styled for this page.
const InventorySection = ({ title, collectionName, property, user, fields, placeholders, displayLogic, sampleItems }) => {
    const [items, setItems] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        const path = collectionName.startsWith('storageLocations') ? collectionName : `properties/${property.id}/${collectionName}`;
        const itemsRef = collection(db, path);
        const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [property.id, collectionName]);

    const handleSaveItem = async (itemData) => {
        const path = collectionName.startsWith('storageLocations') ? collectionName : `properties/${property.id}/${collectionName}`;
        const itemsRef = collection(db, path);
        if (editingItem) {
            const itemDoc = doc(db, itemsRef.path, editingItem.id);
            await updateDoc(itemDoc, itemData);
        } else {
            await addDoc(itemsRef, { ...itemData, ownerId: user.uid, createdAt: serverTimestamp() });
        }
        setShowAddForm(false);
        setEditingItem(null);
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            const path = collectionName.startsWith('storageLocations') ? collectionName : `properties/${property.id}/${collectionName}`;
            const itemDoc = doc(db, collection(db, path).path, itemId);
            await deleteDoc(itemDoc);
        }
    };
    
    const handleGenerateSample = async () => {
        const batch = writeBatch(db);
        const path = collectionName.startsWith('storageLocations') ? collectionName : `properties/${property.id}/${collectionName}`;
        const itemsRef = collection(db, path);
        sampleItems.forEach(item => {
            const newDocRef = doc(itemsRef);
            batch.set(newDocRef, { ...item, ownerId: user.uid, createdAt: serverTimestamp() });
        });
        await batch.commit();
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                <button onClick={() => { setEditingItem(null); setShowAddForm(!showAddForm); }} className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold px-4 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 text-sm flex items-center">
                    <Plus size={16} className="mr-2" />
                    {showAddForm ? 'Cancel' : `Add ${title.slice(0, -1)}`}
                </button>
            </div>
            {showAddForm && (
                <InventoryItemForm 
                    onSave={handleSaveItem}
                    onCancel={() => { setShowAddForm(false); setEditingItem(null); }}
                    fields={fields}
                    placeholders={placeholders}
                    existingItem={editingItem}
                />
            )}
            <ul className="mt-4 space-y-2 divide-y divide-gray-200 dark:divide-gray-700">
                {items.length === 0 && !showAddForm && sampleItems && (
                     <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <p className="text-gray-500 dark:text-gray-400">This inventory is empty.</p>
                        <button onClick={handleGenerateSample} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold">Generate a sample list?</button>
                    </div>
                )}
                {items.map(item => (
                    <li key={item.id} className="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">{item.name || item.setName}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {displayLogic && displayLogic(item)}
                            <button onClick={() => { setEditingItem(item); setShowAddForm(true); }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline"><Edit size={16}/></button>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline"><Trash2 size={16}/></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// This is a local version of the InventoryItemForm component, styled for this page.
const InventoryItemForm = ({ onSave, onCancel, fields, placeholders, existingItem }) => {
    const [itemData, setItemData] = useState({});

    useEffect(() => {
        if (existingItem) {
            setItemData(existingItem);
        } else {
            const initialState = {};
            Object.keys(fields).forEach(field => {
                initialState[field] = '';
            });
            setItemData(initialState);
        }
    }, [existingItem, fields]);

    const handleInputChange = (field, value) => {
        setItemData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(itemData);
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-4">
                {Object.keys(fields).map(field => (
                    <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                        <input 
                            value={itemData[field] || ''} 
                            onChange={e => handleInputChange(field, e.target.value)} 
                            placeholder={placeholders[field]}
                            type={fields[field]}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                ))}
                <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">Save</button>
                </div>
            </form>
        </div>
    );
};
