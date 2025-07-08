import React, { useState, useEffect } from 'react';

export const ChecklistTemplateForm = ({ onSave, onCancel, existingTemplate }) => {
    const [name, setName] = useState('');
    const [items, setItems] = useState([{ name: '', description: '', photoURL: '' }]);

    useEffect(() => {
        if (existingTemplate) {
            setName(existingTemplate.name);
            setItems(existingTemplate.items.map(item => ({ ...item })));
        } else {
            setName('');
            setItems([{ name: '', description: '', photoURL: '' }]);
        }
    }, [existingTemplate]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { name: '', description: '', photoURL: '' }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) { alert("Please provide a name for the template."); return; }
        const filteredItems = items.filter(item => item.name.trim() !== '');
        if (filteredItems.length === 0) { alert("Please add at least one item to the checklist."); return; }
        onSave({ name, items: filteredItems });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <h3 className="text-xl font-semibold mb-4">{existingTemplate ? 'Edit Template' : 'Create Cleaning Template'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Template Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Standard Turnover" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Items</label>
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="bg-gray-100 p-4 rounded-lg space-y-2 relative">
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full disabled:opacity-50" disabled={items.length <= 1}>&times;</button>
                                    <input type="text" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} placeholder={`Item ${index + 1} Name`} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                    <textarea value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Add step-by-step instructions..." rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                                    <input type="text" value={item.photoURL} onChange={e => handleItemChange(index, 'photoURL', e.target.value)} placeholder="Example Photo URL (optional)" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddItem} className="mt-2 text-sm text-blue-600 hover:underline">+ Add Another Item</button>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Save Template</button>
                    </div>
                </form>
            </div>
        </div>
    );
};