// --- src/components/ChecklistViews.js ---
// This file handles creating, viewing, and managing checklist templates.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Plus, Trash2, Edit, ListPlus, X } from 'lucide-react';

// --- Pre-generated templates for easy onboarding ---
const preGeneratedTemplates = [
    {
        name: "Standard Post-Checkout Clean",
        items: [
            "Strip all beds and start laundry (sheets and towels)",
            "Wash, dry, and put away all dishes",
            "Wipe down all kitchen counters, sink, and faucet",
            "Check inside fridge and microwave, wipe if needed",
            "Clean and sanitize toilets, showers, and bathroom sinks",
            "Wipe down bathroom mirrors and counters",
            "Dust all accessible surfaces, furniture, and decor",
            "Vacuum all carpets, rugs, and floors",
            "Mop all hard floors",
            "Check for any guest-left items or damages",
            "Restock all consumables (toilet paper, paper towels, soap, coffee)",
            "Make all beds with fresh linens",
            "Take out all trash and recycling to designated bins",
        ]
    },
    {
        name: "Monthly Deep Clean",
        items: [
            "Clean inside of oven and microwave",
            "Clean inside of refrigerator and discard old items",
            "Wash all windows, window sills, and tracks",
            "Dust and wipe down all baseboards and trim",
            "Clean behind and under large furniture (sofa, beds)",
            "Wash shower curtains and liners",
            "Descale coffee maker and kettle",
            "Clean light fixtures, ceiling fans, and vents",
            "Wash all throw pillow covers and blankets",
            "Organize closets and drawers",
            "Test smoke and carbon monoxide detectors",
        ]
    },
    {
        name: "Mid-Stay Tidy-Up (for longer stays)",
        items: [
            "Provide fresh towels and bathmats",
            "Take out accumulated trash and recycling",
            "Wipe down bathroom counters and sinks",

            "Quickly wipe down kitchen counters",
            "Restock toilet paper and other key consumables if needed",
            "Quickly make the bed (if requested by guest)",
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
    }, [user.uid]);

    const handleSave = async (templateData) => {
        try {
            if (editingTemplate) {
                const templateRef = doc(db, "checklistTemplates", editingTemplate.id);
                await updateDoc(templateRef, templateData);
                setEditingTemplate(null);
            } else {
                await addDoc(collection(db, "checklistTemplates"), { ...templateData, ownerId: user.uid, createdAt: serverTimestamp() });
            }
            setShowForm(false);
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Failed to save template.");
        }
    };

    const handleDelete = async (templateId) => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            await deleteDoc(doc(db, "checklistTemplates", templateId));
        }
    };

    // --- NEW: Function to generate sample templates ---
    const handleGenerateSamples = async () => {
        const batch = writeBatch(db);
        const templatesRef = collection(db, "checklistTemplates");
        
        preGeneratedTemplates.forEach(template => {
            const newTemplateRef = doc(templatesRef); // Create a new doc reference
            batch.set(newTemplateRef, {
                ...template,
                ownerId: user.uid,
                createdAt: serverTimestamp()
            });
        });

        await batch.commit();
        alert("Sample templates have been added to your account!");
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Checklist Templates</h3>
                <button onClick={() => { setEditingTemplate(null); setShowForm(true); }} className="button-primary flex items-center">
                    <Plus size={18} className="mr-2" />
                    Create Template
                </button>
            </div>

            {showForm && <ChecklistTemplateForm onSave={handleSave} onCancel={() => { setShowForm(false); setEditingTemplate(null); }} existingTemplate={editingTemplate} />}

            <ul className="mt-4 space-y-3">
                {loading ? <p className="text-center text-gray-500 dark:text-gray-400">Loading templates...</p> : templates.length > 0 ? (
                    templates.map(template => (
                        <li key={template.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <span className="font-semibold text-gray-800 dark:text-gray-100">{template.name}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({template.items.length} items)</span>
                            </div>
                            <div className="space-x-4">
                                <button onClick={() => { setEditingTemplate(template); setShowForm(true); }} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                                <button onClick={() => handleDelete(template.id)} className="font-semibold text-red-600 dark:text-red-400 hover:underline">Delete</button>
                            </div>
                        </li>
                    ))
                ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <p className="text-gray-500 dark:text-gray-400">You don't have any checklist templates yet.</p>
                        <button onClick={handleGenerateSamples} className="mt-2 button-secondary flex items-center mx-auto">
                            <ListPlus size={16} className="mr-2"/>
                            Generate Sample Templates to Get Started
                        </button>
                    </div>
                )}
            </ul>
        </div>
    );
};

export const ChecklistTemplateForm = ({ onSave, onCancel, existingTemplate }) => {
    const [name, setName] = useState('');
    const [items, setItems] = useState(['']);

    useEffect(() => {
        if (existingTemplate) {
            setName(existingTemplate.name);
            setItems(existingTemplate.items.length > 0 ? existingTemplate.items : ['']);
        } else {
            setName('');
            setItems(['']);
        }
    }, [existingTemplate]);

    const handleItemChange = (index, value) => {
        const newItems = [...items];
        newItems[index] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, '']);
    };

    const handleRemoveItem = (index) => {
        if (items.length <= 1) return; // Don't remove the last item
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const filteredItems = items.map(item => item.trim()).filter(item => item !== '');
        if (!name || filteredItems.length === 0) {
            alert("Please provide a template name and at least one checklist item.");
            return;
        }
        onSave({ name, items: filteredItems });
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border dark:border-gray-600 mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{existingTemplate ? 'Edit Template' : 'Create New Template'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Template Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full input-style" placeholder="e.g., Post-Guest Cleaning" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Checklist Items</label>
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center mt-2 space-x-2">
                            <input type="text" value={item} onChange={e => handleItemChange(index, e.target.value)} className="w-full input-style" placeholder={`Item ${index + 1}`} />
                            <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddItem} className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                        <Plus size={16} className="mr-1" /> Add Item
                    </button>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-600">
                    <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                    <button type="submit" className="button-primary">Save Template</button>
                </div>
            </form>
        </div>
    );
};
