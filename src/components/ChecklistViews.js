// --- src/components/ChecklistViews.js ---
// This file handles creating, viewing, and managing checklist templates with improved UI/UX.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Plus, Trash2, ListPlus, Info, Image, ChevronDown, Building, Tag } from 'lucide-react';

// --- Pre-generated templates for easy onboarding ---
const preGeneratedTemplates = [
    {
        name: "Standard Post-Checkout Clean",
        taskType: "Cleaning",
        linkedProperties: [],
        items: [
            { text: "Strip all beds and start laundry", instructions: "1. Gather all used towels, bathmats, sheets, and pillowcases.\n2. Start the first load of laundry on a warm cycle.\n3. Use one detergent pod.", imageUrl: "" },
            { text: "Wash, dry, and put away all dishes", instructions: "1. Empty the dishwasher if it contains clean dishes.\n2. Load any dirty dishes from the sink or counters.\n3. Run the dishwasher on a normal cycle.\n4. Hand-wash any items that are not dishwasher-safe.", imageUrl: "" },
            { text: "Wipe down all kitchen counters and sink", instructions: "1. Clear all items from the counters.\n2. Spray with multi-surface cleaner and wipe down with a clean cloth.\n3. Scrub the sink basin and faucet handles until they shine.", imageUrl: "" },
            { text: "Clean and sanitize toilets, showers, and bathroom sinks", instructions: "1. Spray toilet bowl, seat, and exterior with disinfectant. Let it sit.\n2. Spray shower walls, tub, and sink.\n3. Wipe down the sink and shower, then scrub the toilet bowl and wipe the exterior.\n4. Check and clear hair from all drains.", imageUrl: "" },
            { text: "Dust all accessible surfaces", instructions: "Use a microfiber cloth to dust all hard surfaces, including nightstands, dressers, tables, window sills, and the tops of picture frames. Don't forget electronics like the TV.", imageUrl: "" },
            { text: "Vacuum all carpets and mop all hard floors", instructions: "1. Vacuum all rugs and carpeted areas.\n2. Sweep or vacuum all hard floors to remove debris.\n3. Mop hard floors with an appropriate cleaning solution, starting from the far corner of the room and moving toward the exit.", imageUrl: "" },
            { text: "Restock all consumables", instructions: "1. Leave two new rolls of toilet paper in each bathroom.\n2. Ensure paper towel roll is at least half full.\n3. Refill hand soap and dish soap dispensers.\n4. Restock the coffee station with at least 10 coffee pods, sugar, and creamers.", imageUrl: "" },
            { text: "Make all beds with fresh linens", instructions: "1. Use one fitted sheet, one flat sheet, and two pillowcases per bed.\n2. Ensure the flat sheet is placed with the finished side down.\n3. Tuck sheets in tightly for a crisp look.\n4. Fluff pillows and place decorative cushions.", imageUrl: "" },
        ]
    },
    {
        name: "Monthly Deep Clean",
        taskType: "Maintenance",
        linkedProperties: [],
        items: [
            { text: "Clean inside of oven and microwave", instructions: "For Microwave:\n1. Mix 1 cup water and juice of one lemon in a microwave-safe bowl.\n2. Microwave on high for 3-5 minutes until it boils.\n3. Let it stand for 5 minutes before opening.\n4. Wipe the inside clean with a sponge.\n\nFor Oven:\n1. Remove racks and soak in hot, soapy water.\n2. Use an oven-safe cleaner, following the product's instructions for application and ventilation.\n3. Scrub and wipe clean.", imageUrl: "" },
            { text: "Test smoke and carbon monoxide detectors", instructions: "1. Press and hold the 'Test' button on each detector for a few seconds.\n2. A loud alarm should sound. If it's weak or doesn't sound, replace the batteries.\n3. Test again after replacing batteries. If it still fails, report the unit for immediate replacement.", imageUrl: "https://i.imgur.com/L3n4m2R.png" },
            { text: "Wash all windows, inside and out", instructions: "1. Mix a few drops of dish soap in a bucket of warm water.\n2. Use a sponge to wash the window surface.\n3. Use a clean squeegee to wipe the window dry, starting from the top and pulling down in one smooth motion.\n4. Wipe the blade clean after each stroke.", imageUrl: "" },
            { text: "Dust and wipe down all baseboards and trim", instructions: "1. Use a vacuum with a brush attachment to remove loose dust from baseboards and door/window trim.\n2. Mix a mild cleaner with warm water.\n3. Use a microfiber cloth dipped in the solution to wipe down all baseboards and trim, removing scuffs and dirt.", imageUrl: "" },
        ]
    }
];


// --- Main Component for Viewing Checklist Templates ---
export const ChecklistsView = ({ user }) => {
    const [templates, setTemplates] = useState([]);
    const [properties, setProperties] = useState([]);
    const [editingTemplateId, setEditingTemplateId] = useState(null); // Can be 'new', an id, or null
    const [expandedState, setExpandedState] = useState({}); // Manages expanded templates and items
    const [loading, setLoading] = useState(true);

    // --- Data Fetching Effect ---
    useEffect(() => {
        if (!user) return;
        const qTemplates = query(collection(db, "checklistTemplates"), where("ownerId", "==", user.uid));
        const unsubTemplates = onSnapshot(qTemplates, (snapshot) => {
            const sortedTemplates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => (a.createdAt?.seconds < b.createdAt?.seconds) ? 1 : -1);
            setTemplates(sortedTemplates);
            setLoading(false);
        });

        const qProperties = query(collection(db, "properties"), where("ownerId", "==", user.uid));
        const unsubProperties = onSnapshot(qProperties, (snapshot) => {
            setProperties(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().propertyName })));
        });

        return () => {
            unsubTemplates();
            unsubProperties();
        };
    }, [user]);

    // --- State Toggle Functions ---
    const toggleTemplate = (templateId) => {
        setExpandedState(prev => ({
            ...prev,
            [templateId]: {
                ...prev[templateId],
                isExpanded: !prev[templateId]?.isExpanded,
            }
        }));
    };

    const toggleItem = (templateId, itemIndex) => {
        setExpandedState(prev => ({
            ...prev,
            [templateId]: {
                ...prev[templateId],
                [itemIndex]: !prev[templateId]?.[itemIndex]
            }
        }));
    };

    // --- CRUD Operations ---
    const handleSave = async (templateData) => {
        try {
            if (editingTemplateId && editingTemplateId !== 'new') {
                await updateDoc(doc(db, "checklistTemplates", editingTemplateId), templateData);
            } else {
                await addDoc(collection(db, "checklistTemplates"), { ...templateData, ownerId: user.uid, createdAt: serverTimestamp() });
            }
            setEditingTemplateId(null);
        } catch (error) { console.error("Error saving template:", error); alert("Failed to save template."); }
    };

    const handleDelete = async (templateId) => {
        if (window.confirm("Are you sure you want to delete this template?")) {
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
    
    // --- Render Helper for Checklist Items ---
    const renderChecklistItem = (item, templateId, index) => {
        const itemObject = typeof item === 'string' ? { text: item, instructions: '', imageUrl: '' } : item;
        const isExpanded = !!expandedState[templateId]?.[index];
        const hasDetails = itemObject.instructions || itemObject.imageUrl;

        return (
            <li key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                         <span className="h-2 w-2 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></span>
                         <span className="text-gray-800 dark:text-gray-200">{itemObject.text}</span>
                    </div>
                    {hasDetails && (
                        <button onClick={() => toggleItem(templateId, index)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200">
                            <ChevronDown size={20} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
                {isExpanded && hasDetails && (
                    <div className="mt-3 ml-3 pl-4 border-l-2 border-blue-500 animate-fade-in-down space-y-2">
                        {itemObject.instructions && (
                            <div className="flex items-start">
                                <Info size={14} className="mr-2 mt-1 flex-shrink-0 text-blue-500"/>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    {itemObject.instructions.split('\n').map((line, i) => (
                                        <span key={i} className="block">{line}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {itemObject.imageUrl && (
                            <div className="pl-6">
                                <img src={itemObject.imageUrl} alt="Instructional" className="rounded-lg max-w-xs max-h-48 border dark:border-gray-600 shadow-sm" />
                            </div>
                        )}
                    </div>
                )}
            </li>
        );
    };

    // --- Main JSX ---
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Checklist Templates</h1>
                <button onClick={() => setEditingTemplateId('new')} className="button-primary flex items-center">
                    <Plus size={18} className="mr-2" />Create Template
                </button>
            </div>

            {editingTemplateId === 'new' && <ChecklistTemplateForm onSave={handleSave} onCancel={() => setEditingTemplateId(null)} properties={properties} />}

            <div className="space-y-4 mt-6">
                {loading ? <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading templates...</p> : templates.length > 0 ? (
                     templates.map(template => {
                        const isTemplateExpanded = !!expandedState[template.id]?.isExpanded;

                        if (editingTemplateId === template.id) {
                            return <ChecklistTemplateForm 
                                key={template.id}
                                existingTemplate={template}
                                onSave={handleSave} 
                                onCancel={() => setEditingTemplateId(null)} 
                                properties={properties} 
                            />
                        }

                        return (
                            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-shadow hover:shadow-md">
                                <div className="p-4 flex justify-between items-center">
                                    <div className="flex-grow cursor-pointer" onClick={() => toggleTemplate(template.id)}>
                                        <div className="flex items-center">
                                            <ChevronDown size={20} className={`mr-3 text-gray-400 transition-transform ${isTemplateExpanded ? 'rotate-180' : ''}`} />
                                            <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">{template.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-4 ml-9 mt-1 text-xs">
                                            <span className="flex items-center text-gray-500 dark:text-gray-400"><Tag size={12} className="mr-1.5" />{template.taskType || 'Any Task'}</span>
                                            <span className="flex items-center text-gray-500 dark:text-gray-400"><Building size={12} className="mr-1.5" />{template.linkedProperties?.length > 0 ? `${template.linkedProperties.length} Linked Properties` : 'All Properties'}</span>
                                        </div>
                                    </div>
                                    <div className="space-x-4 flex-shrink-0">
                                        <button onClick={() => setEditingTemplateId(template.id)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                                        <button onClick={() => handleDelete(template.id)} className="font-semibold text-red-600 dark:text-red-400 hover:underline">Delete</button>
                                    </div>
                                </div>
                                {isTemplateExpanded && (
                                    <div className="px-4 pb-4 animate-fade-in-down">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mt-2 border dark:border-gray-700">
                                            <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-300 mb-2">Checklist Items:</h4>
                                            {(template.items && template.items.length > 0) ? (
                                                <ul className="space-y-1">
                                                    {template.items.map((item, index) => renderChecklistItem(item, template.id, index))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">This template has no checklist items.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700"><p className="text-gray-500 dark:text-gray-400">You don't have any checklist templates yet.</p><button onClick={handleGenerateSamples} className="mt-4 button-secondary flex items-center mx-auto"><ListPlus size={16} className="mr-2"/>Generate Sample Templates</button></div>
                )}
            </div>
        </div>
    );
};


// --- Form Component (with Dark Mode Style Fixes) ---
export const ChecklistTemplateForm = ({ onSave, onCancel, existingTemplate, properties }) => {
    const [name, setName] = useState('');
    const [taskType, setTaskType] = useState('Cleaning');
    const [linkedProperties, setLinkedProperties] = useState([]);
    const [items, setItems] = useState([{ text: '', instructions: '', imageUrl: '' }]);

    useEffect(() => {
        if (existingTemplate) {
            setName(existingTemplate.name || '');
            setTaskType(existingTemplate.taskType || 'Cleaning');
            setLinkedProperties(existingTemplate.linkedProperties || []);
            if (existingTemplate.items && existingTemplate.items.length > 0) {
                // Ensure instructions are always a string to prevent controlled/uncontrolled errors.
                const convertedItems = existingTemplate.items.map(item => {
                    if (typeof item === 'string') {
                        return { text: item, instructions: '', imageUrl: '' };
                    }
                    return { ...item, instructions: item.instructions || '' };
                });
                setItems(convertedItems);
            } else {
                setItems([{ text: '', instructions: '', imageUrl: '' }]);
            }
        } else {
            // For new templates
            setName('');
            setTaskType('Cleaning');
            setLinkedProperties([]);
            setItems([{ text: '', instructions: '', imageUrl: '' }]);
        }
    }, [existingTemplate]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handlePropertyLink = (propId) => {
        setLinkedProperties(prev => prev.includes(propId) ? prev.filter(id => id !== propId) : [...prev, propId]);
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
        onSave({ name, taskType, linkedProperties, items: filteredItems });
    };

    const inputStyles = "mt-1 w-full input-style dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg px-4";
    const itemContainerStyles = "bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border dark:border-gray-600";


    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg mb-6 animate-fade-in-down">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">{existingTemplate ? 'Edit Template' : 'Create New Template'}</h4>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className={inputStyles} placeholder="e.g., Post-Guest Cleaning" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Type</label><select value={taskType} onChange={e => setTaskType(e.target.value)} className={inputStyles}><option>Cleaning</option><option>Maintenance</option><option>Inspection</option></select></div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link to Properties (Optional)</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">If none are selected, this template will be available for all properties.</p>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {properties.map(prop => (
                            <button type="button" key={prop.id} onClick={() => handlePropertyLink(prop.id)} className={`px-3 py-2 text-sm rounded-lg border transition-colors ${linkedProperties.includes(prop.id) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:bg-slate-600'}`}>{prop.name}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Checklist Items</label>
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className={itemContainerStyles}>
                                <div className="flex items-center space-x-3"><input type="text" value={item.text} onChange={e => handleItemChange(index, 'text', e.target.value)} className={inputStyles} placeholder={`Item ${index + 1} Title`} /><button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><Trash2 size={16} /></button></div>
                                <div className="mt-4 space-y-3 pl-1">
                                    <div className="flex items-start space-x-3"><Info size={16} className="text-gray-400 mt-2 flex-shrink-0" /><textarea value={item.instructions} onChange={e => handleItemChange(index, 'instructions', e.target.value)} className={`${inputStyles} text-sm`} placeholder="Add detailed step-by-step instructions..." rows="4" /></div>
                                    <div className="flex items-center space-x-3"><Image size={16} className="text-gray-400 flex-shrink-0" /><input type="text" value={item.imageUrl} onChange={e => handleItemChange(index, 'imageUrl', e.target.value)} className={`${inputStyles} text-sm`} placeholder="Optional: Paste image URL here..." /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddItem} className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center"><Plus size={16} className="mr-1" /> Add Item</button>
                </div>
                <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 dark:border-slate-700"><button type="button" onClick={onCancel} className="button-secondary">Cancel</button><button type="submit" className="button-primary">Save Template</button></div>
            </form>
        </div>
    );
};
