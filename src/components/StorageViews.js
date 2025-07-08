// --- src/components/StorageViews.js ---
// Replace the entire contents of your StorageViews.js file with this code.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';

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
            setStorageLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-gray-800">My Storage Locations</h2>
                <button onClick={() => { setEditingLocation(null); setShowAddForm(!showAddForm); }} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    {showAddForm && !editingLocation ? 'Cancel' : '+ Add Storage'}
                </button>
            </div>

            {showAddForm && <StorageLocationForm onSave={handleSaveLocation} onCancel={() => { setShowAddForm(false); setEditingLocation(null); }} existingLocation={editingLocation} />}

            <div className="space-y-3 mt-6">
                {loading ? <p>Loading...</p> : storageLocations.length > 0 ? (
                    storageLocations.map(location => (
                        <div key={location.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                            <p className="font-semibold text-gray-800">{location.name}</p>
                            <div className="space-x-4">
                                <button onClick={() => setSelectedLocationId(location.id)} className="text-sm text-blue-600 hover:underline">Manage Inventory</button>
                                <button onClick={() => { setEditingLocation(location); setShowAddForm(true); }} className="text-sm text-gray-600 hover:underline">Edit</button>
                                <button onClick={() => handleDeleteLocation(location.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-8">You haven't created any storage locations yet.</p>
                )}
            </div>
        </div>
    );
};

const StorageLocationForm = ({ onSave, onCancel, existingLocation }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (existingLocation) {
            setName(existingLocation.name);
        } else {
            setName('');
        }
    }, [existingLocation]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(name);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3 mb-6">
            <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Storage Name (e.g., Main Building Closet)" 
                className="w-full px-3 py-2 border rounded-md" 
            />
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="w-auto bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Save Location</button>
            </div>
        </form>
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
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg">
            <button onClick={onBack} className="mb-6 text-blue-600 hover:underline">← Back to All Storage Locations</button>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">{location.name}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <InventorySection 
                        title="Stored Supplies"
                        collectionName={`storageLocations/${location.id}/supplies`}
                        property={{id: location.id}}
                        user={user}
                        sampleItems={sampleData.supplies}
                        fields={{ name: 'text', parLevel: 'number', currentStock: 'number' }}
                        placeholders={{name: "Supply Name (e.g., Toilet Paper Rolls)", parLevel: "Re-order at (e.g., 10)", currentStock: "Current Stock (e.g., 50)"}}
                        displayLogic={(item) => (
                            <div className="flex items-center space-x-4">
                                <div className={`w-3 h-3 rounded-full ${parseInt(item.currentStock) < parseInt(item.parLevel) ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <span className="text-gray-600">Stock: {item.currentStock || 0} / {item.parLevel || 0}</span>
                            </div>
                        )}
                    />
                </div>
                <div className="lg:col-span-1 bg-gray-50 p-6 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-semibold text-gray-700">Linked Properties</h3>
                        <button onClick={() => setShowLinkManager(true)} className="text-sm text-blue-600 hover:underline">Manage</button>
                    </div>
                    <ul className="space-y-2">
                        {linkedProperties.map(prop => (
                            <li key={prop.id} className="bg-white p-2 rounded-md border text-sm">{prop.propertyName}</li>
                        ))}
                        {linkedProperties.length === 0 && <p className="text-sm text-gray-500">No properties linked yet.</p>}
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
        const q = query(collection(db, 'properties'), where('ownerId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAllProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [user.uid]);

    const handleToggleLink = async (propertyId) => {
        const locationRef = doc(db, 'storageLocations', location.id);
        if (linkedIds.includes(propertyId)) {
            await updateDoc(locationRef, { linkedProperties: arrayRemove(propertyId) });
            setLinkedIds(prev => prev.filter(id => id !== propertyId));
        } else {
            await updateDoc(locationRef, { linkedProperties: arrayUnion(propertyId) });
            setLinkedIds(prev => [...prev, propertyId]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-semibold mb-4">Link Properties to {location.name}</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {allProperties.map(prop => (
                        <div key={prop.id} className="flex items-center">
                            <input 
                                type="checkbox"
                                id={`link-${prop.id}`}
                                checked={linkedIds.includes(prop.id)}
                                onChange={() => handleToggleLink(prop.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`link-${prop.id}`} className="ml-3 block text-sm text-gray-900">{prop.propertyName}</label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Done</button>
                </div>
            </div>
        </div>
    );
};

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
            const itemsRef = collection(db, path);
            const itemDoc = doc(db, itemsRef.path, itemId);
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

    const handleEditClick = (item) => {
        setEditingItem(item);
        setShowAddForm(true);
    };
    
    const handleCancel = () => {
        setShowAddForm(false);
        setEditingItem(null);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-700">{title}</h3>
                <button onClick={() => { setEditingItem(null); setShowAddForm(!showAddForm); }} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 text-sm">
                    {showAddForm && !editingItem ? 'Cancel' : `+ Add ${title.slice(0, -1)}`}
                </button>
            </div>
            {showAddForm && (
                <InventoryItemForm 
                    onSave={handleSaveItem}
                    onCancel={handleCancel}
                    fields={fields}
                    placeholders={placeholders}
                    existingItem={editingItem}
                />
            )}
            <ul className="space-y-2">
                {items.length === 0 && !showAddForm && sampleItems && (
                     <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-gray-500">This inventory is empty.</p>
                        <button onClick={handleGenerateSample} className="mt-2 text-sm text-blue-600 hover:underline">Generate a sample list to get started?</button>
                    </div>
                )}
                {items.map(item => (
                    <li key={item.id} className="bg-white p-3 rounded-md border flex justify-between items-center">
                        <div>
                            <p className="font-medium text-gray-800">{item.name || item.setName}</p>
                            {item.notes && <p className="text-sm text-gray-500">{item.notes}</p>}
                        </div>
                        <div className="flex items-center space-x-4">
                            {displayLogic && displayLogic(item)}
                            <button onClick={() => handleEditClick(item)} className="text-xs text-blue-500 hover:underline">Edit</button>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const InventoryItemForm = ({ onSave, onCancel, fields, placeholders, existingItem }) => {
    const [itemData, setItemData] = useState({});

    useEffect(() => {
        if (existingItem) {
            setItemData(existingItem);
        } else {
            const initialState = {};
            Object.keys(fields).forEach(field => {
                initialState[field] = Array.isArray(fields[field]) ? fields[field][0] : '';
            });
            setItemData(initialState);
        }
    }, [existingItem, fields]);

    const handleInputChange = (field, value) => {
        setItemData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const firstField = Object.keys(fields)[0];
        if (!itemData[firstField] || (typeof itemData[firstField] === 'string' && !itemData[firstField].trim())) {
            alert(`Please enter a value for ${firstField}.`);
            return;
        }
        onSave(itemData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4">
            {Object.keys(fields).map(field => {
                if (Array.isArray(fields[field])) {
                    return (
                        <select key={field} value={itemData[field] || ''} onChange={e => handleInputChange(field, e.target.value)} className="w-full px-3 py-2 border rounded-md">
                            {fields[field].map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                    );
                }
                if (fields[field] === 'textarea') {
                    return <textarea key={field} value={itemData[field] || ''} onChange={e => handleInputChange(field, e.target.value)} placeholder={placeholders[field]} rows="2" className="w-full px-3 py-2 border rounded-md" />
                }
                return (
                    <input 
                        key={field}
                        value={itemData[field] || ''} 
                        onChange={e => handleInputChange(field, e.target.value)} 
                        placeholder={placeholders[field]}
                        type={fields[field]}
                        className="w-full px-3 py-2 border rounded-md" 
                    />
                );
            })}
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Save</button>
            </div>
        </form>
    );
};
