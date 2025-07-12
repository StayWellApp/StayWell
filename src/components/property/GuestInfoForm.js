// src/components/property/GuestInfoForm.js
// NEW component for editing guest-specific information, including custom fields.

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Home, Key, Plus, Trash2 } from 'lucide-react';

export const GuestInfoForm = ({ property, onSave, onCancel }) => {
    const [houseRules, setHouseRules] = useState(property.houseRules || '');
    const [accessInfo, setAccessInfo] = useState(property.accessInfo || { doorCode: '', wifiPassword: '', lockboxCode: '', parkingInstructions: '' });
    const [customInfo, setCustomInfo] = useState(property.customInfo || []);
    const [isLoading, setIsLoading] = useState(false);

    const handleAccessInfoChange = (field, value) => {
        setAccessInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleCustomInfoChange = (index, field, value) => {
        const newCustomInfo = [...customInfo];
        newCustomInfo[index][field] = value;
        setCustomInfo(newCustomInfo);
    };

    const addCustomField = () => {
        setCustomInfo([...customInfo, { label: '', value: '' }]);
    };

    const removeCustomField = (index) => {
        const newCustomInfo = customInfo.filter((_, i) => i !== index);
        setCustomInfo(newCustomInfo);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading("Saving guest information...");

        try {
            const updatedData = {
                houseRules,
                accessInfo,
                customInfo: customInfo.filter(field => field.label && field.value) // Filter out empty fields
            };
            await onSave(updatedData);
            toast.update(toastId, {
                render: "Guest info saved successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000
            });
            onCancel(); // Close modal on success
        } catch (error) {
            console.error("Error saving guest info:", error);
            toast.update(toastId, {
                render: "Failed to save guest info.",
                type: "error",
                isLoading: false,
                autoClose: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-2xl border dark:border-gray-700 max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Guest Information</h2>
                <form onSubmit={handleSubmit} className="space-y-8 overflow-y-auto pr-2 flex-grow">
                    {/* Access Info */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center"><Key size={20} className="mr-2"/> Access Information</label>
                        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="doorCode">Door Code</label><input type="text" id="doorCode" value={accessInfo.doorCode} onChange={(e) => handleAccessInfoChange('doorCode', e.target.value)} className="input-style" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="wifiPassword">Wi-Fi Password</label><input type="text" id="wifiPassword" value={accessInfo.wifiPassword} onChange={(e) => handleAccessInfoChange('wifiPassword', e.target.value)} className="input-style" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="lockboxCode">Lockbox Code</label><input type="text" id="lockboxCode" value={accessInfo.lockboxCode} onChange={(e) => handleAccessInfoChange('lockboxCode', e.target.value)} className="input-style" /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="parkingInstructions">Parking Instructions</label><textarea id="parkingInstructions" value={accessInfo.parkingInstructions} onChange={(e) => handleAccessInfoChange('parkingInstructions', e.target.value)} className="input-style" rows="2"></textarea></div>
                        </div>
                    </div>
                    {/* House Rules */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center"><Home size={20} className="mr-2"/> House Rules</label>
                        <textarea value={houseRules} onChange={(e) => setHouseRules(e.target.value)} className="input-style" rows="4" placeholder="e.g., No smoking inside. Quiet hours are from 10 PM to 8 AM..."></textarea>
                    </div>
                    {/* Custom Fields */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Custom Information</label>
                        <div className="space-y-3">
                            {customInfo.map((field, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <input type="text" placeholder="Label (e.g., Trash Day)" value={field.label} onChange={(e) => handleCustomInfoChange(index, 'label', e.target.value)} className="input-style flex-1" />
                                    <input type="text" placeholder="Value (e.g., Tuesday morning)" value={field.value} onChange={(e) => handleCustomInfoChange(index, 'value', e.target.value)} className="input-style flex-1" />
                                    <button type="button" onClick={() => removeCustomField(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addCustomField} className="button-secondary mt-4 text-sm">
                            <Plus size={16} className="mr-2" /> Add Custom Field
                        </button>
                    </div>
                </form>
                <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="button-primary" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Guest Info'}
                    </button>
                </div>
            </div>
        </div>
    );
};
