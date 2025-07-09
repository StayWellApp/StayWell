// --- src/components/ChecklistViews.js ---
// This file handles creating, viewing, and managing detailed checklist templates.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Plus, Trash2, ListPlus, Image, Info } from 'lucide-react';

// --- NEW: Updated data structure for pre-generated templates ---
const preGeneratedTemplates = [
    {
        name: "Standard Post-Checkout Clean",
        items: [
            { text: "Strip all beds and start laundry", instructions: "Include all sheets, pillowcases, and towels.", imageUrl: "" },
            { text: "Wash, dry, and put away all dishes", instructions: "Check the dishwasher first. Ensure the sink is empty and clean.", imageUrl: "" },
            { text: "Wipe down all kitchen counters and sink", instructions: "Use multi-surface cleaner. Don't forget the faucet.", imageUrl: "" },
            { text: "Clean and sanitize toilets, showers, and bathroom sinks", instructions: "Use appropriate bathroom cleaner. Check for hair in drains.", imageUrl: "" },
            { text: "Dust all accessible surfaces", instructions: "This includes tables, nightstands, dressers, and window sills.", imageUrl: "" },
            { text: "Vacuum all carpets and mop all hard floors", instructions: "Start from the farthest corner and work your way out.", imageUrl: "" },
            { text: "Restock all consumables", instructions: "Check levels of toilet paper, paper towels, soap, and coffee pods. Refill as needed.", imageUrl: "" },
            { text: "Make all beds with fresh linens", instructions: "Ensure linens are wrinkle-free and pillows are fluffed.", imageUrl: "" },
        ]
    },
    {
        name: "Monthly Deep Clean",
        items: [
            { text: "Clean inside of oven and microwave", instructions: "Use oven cleaner for the oven. A bowl of water and lemon juice microwaved for 3 minutes helps loosen grime inside.", imageUrl: "" },
            { text: "Test smoke and carbon monoxide detectors", instructions: "Press and hold the 'Test' button on each unit until it beeps loudly. If it doesn't beep, replace the batteries. If it still doesn't work, report it for replacement.", imageUrl: "https://i.imgur.com/L3n4m2R.png" },
            { text: "Wash all windows, inside and out", instructions: "Use a squeegee for a streak-free finish.", imageUrl: "" },
            { text: "Dust and wipe down all baseboards and trim", instructions: "A damp cloth works well for this task.", imageUrl: "" },
        ]
    }
];

export const ChecklistsView = ({ user }) => {
    const [templates, setTemplates] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "checklistTemplates"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    const handleSave = async (templateData) => {
        try {
            if (editingTemplate) {
                await updateDoc(doc(db, "checklistTemplates", editingTemplate.id), templateData);
                setEditingTemplate(null);
            } else {
                await addDoc(collection(db, "checklistTemplates"), { ...templateData, ownerId: user.uid, createdAt: serverTimestamp() });
            }
            setShowForm(false);
        } catch (error) { console.error("Error saving template:", error); alert("Failed to save template."); }
    };

    const handleDelete = async (templateId) => {
        if (window.confirm("Are you sure?")) {
            await deleteDoc(doc(db, "checklistTemplates", templateId));
        }
    };

    const handleGenerateSamples = async () => {
        const batch = writeBatch(db);
        const templatesRef = collection(db, "checklistTemplates");
        preGeneratedTemplates.forEach(template => {
            const newTemplateRef = doc(templatesRef);
            batch.set(newTemplateRef, { ...template, ownerId: user.uid, createdAt: serverTimestamp() });
        });
        await batch.commit();
        alert("Sample templates added!");
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Checklist Templates</h1>
                <button onClick={() => { setEditingTemplate(null); setShowForm(true); }} className="button-primary flex items-center">
                    <Plus size={18} className="mr-2" />Create Template
                </button>
            </div>

            {showForm && <ChecklistTemplateForm onSave={handleSave} onCancel={() => { setShowForm(false); setEditingTemplate(null); }} existingTemplate={editingTemplate} />}

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                {loading ? <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</p> : templates.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {templates.map(template => (
                            <li key={template.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-gray-800 dark:text-gray-100">{template.name}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({template.items.length} items)</span>
                                </div>
                                <div className="space-x-4">
                                    <button onClick={() => { setEditingTemplate(template); setShowForm(true); }} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(template.id)} className="font-semibold text-red-600 dark:text-red-400 hover:underline">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">You don't have any checklist templates yet.</p>
                        <button onClick={handleGenerateSamples} className="mt-2 button-secondary flex items-center mx-auto">
                            <ListPlus size={16} className="mr-2"/>Generate Sample Templates
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ChecklistTemplateForm = ({ onSave, onCancel, existingTemplate }) => {
    const [name, setName] = useState('');
    const [items, setItems] = useState([{ text: '', instructions: '', imageUrl: '' }]);

    useEffect(() => {
        if (existingTemplate) {
            setName(existingTemplate.name);
            setItems(existingTemplate.items.length > 0 ? existingTemplate.items : [{ text: '', instructions: '', imageUrl: '' }]);
        } else {
            setName('');
            setItems([{ text: '', instructions: '', imageUrl: '' }]);
        }
    }, [existingTemplate]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => setItems([...items, { text: '', instructions: '', imageUrl: '' }]);
    const handleRemoveItem = (index) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const filteredItems = items.filter(item => item.text.trim() !== '');
        if (!name || filteredItems.length === 0) {
            alert("Please provide a template name and at least one checklist item.");
            return;
        }
        onSave({ name, items: filteredItems });
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{existingTemplate ? 'Edit Template' : 'Create New Template'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Template Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full input-style" placeholder="e.g., Post-Guest Cleaning" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Checklist Items</label>
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-600">
                                <div className="flex items-center space-x-2">
                                    <input type="text" value={item.text} onChange={e => handleItemChange(index, 'text', e.target.value)} className="w-full input-style" placeholder={`Item ${index + 1} Title`} />
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><Trash2 size={16} /></button>
                                </div>
                                <div className="mt-3 space-y-3">
                                    <div className="flex items-start space-x-2">
                                        <Info size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                                        <textarea value={item.instructions} onChange={e => handleItemChange(index, 'instructions', e.target.value)} className="w-full input-style text-sm" placeholder="Add detailed step-by-step instructions..." rows="2" />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Image size={16} className="text-gray-400 flex-shrink-0" />
                                        <input type="text" value={item.imageUrl} onChange={e => handleItemChange(index, 'imageUrl', e.target.value)} className="w-full input-style text-sm" placeholder="Optional: Paste image URL here..." />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddItem} className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center"><Plus size={16} className="mr-1" /> Add Item</button>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-600">
                    <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                    <button type="submit" className="button-primary">Save Template</button>
                </div>
            </form>
        </div>
    );
};
