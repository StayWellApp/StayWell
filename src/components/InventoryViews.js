// --- src/components/InventoryViews.js ---
// Replace the entire contents of your InventoryViews.js file with this code.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';

// --- Sample Data for Pre-generation ---
const sampleData = {
    fittings: [
        { name: 'Kettle', notes: 'Brand: Russell Hobbs' },
        { name: 'Toaster', notes: '' },
        { name: 'Microwave', notes: '' },
        { name: 'Main TV', notes: '55" Samsung Smart TV' },
        { name: 'Dinner Plate', notes: 'Set of 4' },
    ],
    consumables: [
        { name: 'Coffee Pods', parLevel: 20, currentStock: 20, purchasePrice: 0.50 },
        { name: 'Toilet Paper Roll', parLevel: 4, currentStock: 4, purchasePrice: 0.75 },
        { name: 'Shampoo', parLevel: 2, currentStock: 2, purchasePrice: 1.20 },
        { name: 'Hand Soap', parLevel: 2, currentStock: 2, purchasePrice: 1.50 },
    ],
    linens: [
        { name: 'King Sheet Set', total: 8, inUnit: 2, inLaundry: 2, washCount: 10, retireAfter: 50 },
        { name: 'Bath Towel', total: 16, inUnit: 4, inLaundry: 4, washCount: 25, retireAfter: 60 },
    ],
    supplies: [
        { name: 'Toilet Paper (Bulk)', parLevel: 12, currentStock: 24 },
        { name: 'Paper Towels (Bulk)', parLevel: 6, currentStock: 12 },
        { name: 'All-Purpose Cleaner', parLevel: 1, currentStock: 2 },
        { name: 'Trash Bags', parLevel: 20, currentStock: 50 },
    ]
};

export const InventoryView = ({ property, user }) => {
    
    const [reportingIssue, setReportingIssue] = useState(null);

    const handleReportIssue = async (taskData) => {
        const tasksRef = collection(db, 'tasks');
        await addDoc(tasksRef, {
            ...taskData,
            taskType: 'Maintenance',
            status: 'Pending',
            propertyId: property.id,
            propertyName: property.propertyName,
            propertyAddress: property.address,
            ownerId: user.uid,
            createdAt: serverTimestamp()
        });
        setReportingIssue(null);
        alert('Maintenance task created successfully!');
    };

    return (
        <div className="space-y-8">
            <InventorySection 
                title="Permanent Fittings"
                collectionName="fittings"
                property={property}
                user={user}
                sampleItems={sampleData.fittings}
                fields={{ name: 'text', notes: 'textarea' }}
                placeholders={{name: "Item Name (e.g., Kettle)", notes: "Notes (e.g., Brand, model, condition)"}}
                onReportIssue={(item) => setReportingIssue(item)}
            />
            <InventorySection 
                title="Guest Consumables"
                collectionName="consumables"
                property={property}
                user={user}
                sampleItems={sampleData.consumables}
                fields={{ name: 'text', parLevel: 'number', currentStock: 'number', purchasePrice: 'number' }}
                placeholders={{name: "Item Name (e.g., Coffee Pods)", parLevel: "Par Level (e.g., 20)", currentStock: "Current Stock (e.g., 15)", purchasePrice: "Purchase Price ($)"}}
                displayLogic={(item) => (
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">${parseFloat(item.purchasePrice || 0).toFixed(2)}</span>
                        <div className={`w-3 h-3 rounded-full ${parseInt(item.currentStock) < parseInt(item.parLevel) ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className="text-gray-600">Stock: {item.currentStock || 0} / {item.parLevel || 0}</span>
                    </div>
                )}
            />
            <InventorySection 
                title="Linens"
                collectionName="linens"
                property={property}
                user={user}
                sampleItems={sampleData.linens}
                fields={{ name: 'text', total: 'number', inUnit: 'number', inLaundry: 'number', washCount: 'number', retireAfter: 'number' }}
                placeholders={{name: "Linen Type (e.g., King Sheet Set)", total: "Total in Circulation", inUnit: "In Unit (Par)", inLaundry: "In Laundry", washCount: "Total Washes", retireAfter: "Retire After # Washes"}}
                isLinen={true}
            />
            <InventorySection 
                title="Stored Supplies"
                collectionName="supplies"
                property={property}
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
            {reportingIssue && <ReportIssueModal item={reportingIssue} onSave={handleReportIssue} onClose={() => setReportingIssue(null)} />}
        </div>
    );
};

const InventorySection = ({ title, collectionName, property, user, fields, placeholders, displayLogic, sampleItems, onReportIssue, isLinen = false }) => {
    const [items, setItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showLinenModal, setShowLinenModal] = useState(null);

    useEffect(() => {
        const itemsRef = collection(db, 'properties', property.id, collectionName);
        const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [property.id, collectionName]);

    const handleSaveItem = async (itemData) => {
        const itemsRef = collection(db, 'properties', property.id, collectionName);
        if (editingItem) {
            const itemDoc = doc(db, itemsRef.path, editingItem.id);
            await updateDoc(itemDoc, itemData);
        } else {
            await addDoc(itemsRef, { ...itemData, ownerId: user.uid, createdAt: serverTimestamp() });
        }
        setShowForm(false);
        setEditingItem(null);
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            const itemDoc = doc(db, 'properties', property.id, collectionName, itemId);
            await deleteDoc(itemDoc);
        }
    };
    
    const handleGenerateSample = async () => {
        const batch = writeBatch(db);
        const itemsRef = collection(db, 'properties', property.id, collectionName);
        sampleItems.forEach(item => {
            const newDocRef = doc(itemsRef);
            batch.set(newDocRef, { ...item, ownerId: user.uid, createdAt: serverTimestamp() });
        });
        await batch.commit();
    };

    const handleEditClick = (item) => {
        setEditingItem(item);
        setShowForm(true);
    };
    
    const handleCancel = () => {
        setShowForm(false);
        setEditingItem(null);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-700">{title}</h3>
                <button onClick={() => { setEditingItem(null); setShowForm(true); }} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 text-sm">
                    {`+ Add ${title.slice(0, -1)}`}
                </button>
            </div>
            {showForm && (
                <InventoryItemForm 
                    onSave={handleSaveItem}
                    onCancel={handleCancel}
                    fields={fields}
                    placeholders={placeholders}
                    existingItem={editingItem}
                    title={title}
                />
            )}
            <ul className="space-y-2">
                {items.length === 0 && !showForm && sampleItems && (
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
                            {isLinen && <LinenDisplay item={item} />}
                            {displayLogic && !isLinen && displayLogic(item)}
                            {onReportIssue && <button onClick={() => onReportIssue(item)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200">Report Issue</button>}
                            {isLinen && <button onClick={() => setShowLinenModal(item)} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md hover:bg-purple-200">Update Status</button>}
                            <button onClick={() => handleEditClick(item)} className="text-xs text-blue-500 hover:underline">Edit</button>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
            {showLinenModal && <LinenStatusModal item={showLinenModal} property={property} onClose={() => setShowLinenModal(null)} />}
        </div>
    );
};

const InventoryItemForm = ({ onSave, onCancel, fields, placeholders, existingItem, title }) => {
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-semibold mb-4">{existingItem ? `Edit ${title.slice(0, -1)}` : `Add New ${title.slice(0, -1)}`}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {Object.keys(fields).map(field => (
                        <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                            {Array.isArray(fields[field]) ? (
                                <select value={itemData[field] || ''} onChange={e => handleInputChange(field, e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                                    {fields[field].map(option => <option key={option} value={option}>{option}</option>)}
                                </select>
                            ) : fields[field] === 'textarea' ? (
                                <textarea value={itemData[field] || ''} onChange={e => handleInputChange(field, e.target.value)} placeholder={placeholders[field]} rows="2" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            ) : (
                                <input 
                                    value={itemData[field] || ''} 
                                    onChange={e => handleInputChange(field, e.target.value)} 
                                    placeholder={placeholders[field]}
                                    type={fields[field]}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" 
                                />
                            )}
                        </div>
                    ))}
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ReportIssueModal = ({ item, onSave, onClose }) => {
    const [title, setTitle] = useState(`FIX: ${item.name}`);
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ taskName: title, description, priority });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-semibold mb-4">Report Issue for: {item.name}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue..." rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                        <select value={priority} onChange={e => setPriority(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Photo of Issue</label>
                        <button type="button" disabled className="mt-1 w-full flex justify-center py-2 px-4 border border-dashed rounded-md text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed">
                            Upload Photo (Coming Soon)
                        </button>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Create Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LinenDisplay = ({ item }) => {
    const inStorage = (item.total || 0) - (item.inUnit || 0) - (item.inLaundry || 0);
    const avgWashCount = item.total > 0 ? ((item.washCount || 0) / item.total).toFixed(1) : 0;
    const needsReplacing = item.retireAfter && avgWashCount >= item.retireAfter;

    return (
        <div className="flex items-center space-x-4 text-xs">
            {needsReplacing && <div className="w-3 h-3 rounded-full bg-red-500" title="Replacement Recommended"></div>}
            <span title="Average Wash Count" className="text-gray-500">Washes: {avgWashCount}</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Unit: {item.inUnit || 0}</span>
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Laundry: {item.inLaundry || 0}</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Storage: {inStorage}</span>
        </div>
    );
};

const LinenStatusModal = ({ item, property, onClose }) => {
    const [inUnit, setInUnit] = useState(item.inUnit || 0);
    const [inLaundry, setInLaundry] = useState(item.inLaundry || 0);

    const handleUpdate = async () => {
        const washedCount = Math.max(0, item.inLaundry - inLaundry);
        const itemRef = doc(db, 'properties', property.id, 'linens', item.id);
        await updateDoc(itemRef, {
            inUnit: Number(inUnit),
            inLaundry: Number(inLaundry),
            washCount: increment(washedCount)
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Update Status for {item.name}</h3>
                <p className="text-sm text-gray-500 mb-4">Total in circulation: {item.total}</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700"># In Unit</label>
                        <input type="number" value={inUnit} onChange={e => setInUnit(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700"># In Laundry</label>
                        <input type="number" value={inLaundry} onChange={e => setInLaundry(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={handleUpdate} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Update</button>
                </div>
            </div>
        </div>
    );
};
