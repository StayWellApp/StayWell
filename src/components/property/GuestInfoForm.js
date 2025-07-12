// src/components/property/GuestInfoForm.js
// FINAL CORRECTED FILE

import React, { useState } from 'react';
import { db } from '../../firebase-config';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Info, Plus, Trash2 } from 'lucide-react';

export const GuestInfoForm = ({ property, onSave, onCancel }) => {
    const [accessInfo, setAccessInfo] = useState(property.accessInfo || {
        doorCode: '',
        wifiPassword: '',
        lockboxCode: '',
        parkingInstructions: ''
    });
    const [houseRules, setHouseRules] = useState(property.houseRules || '');
    const [customInfo, setCustomInfo] = useState(property.customInfo || []);

    const handleAccessInfoChange = (e) => {
        const { name, value } = e.target;
        setAccessInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomInfoChange = (index, e) => {
        const { name, value } = e.target;
        const newCustomInfo = [...customInfo];
        newCustomInfo[index][name] = value;
        setCustomInfo(newCustomInfo);
    };

    const addCustomInfoField = () => {
        setCustomInfo([...customInfo, { label: '', value: '' }]);
    };

    const removeCustomInfoField = (index) => {
        const newCustomInfo = customInfo.filter((_, i) => i !== index);
        setCustomInfo(newCustomInfo);
    };

    const handleSaveChanges = async () => {
        const toastId = toast.loading("Saving guest information...");
        const dataToSave = {
            accessInfo,
            houseRules,
            customInfo
        };
        try {
            await onSave(dataToSave);
            toast.update(toastId, { render: "Guest info saved successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Error saving guest info:", error);
            toast.update(toastId, { render: "Failed to save guest info.", type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Guest Information</h2>
            
            {/* Access Information Section */}
            <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">Access Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="doorCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Door Code</label>
                        <input type="text" name="doorCode" id="doorCode" value={accessInfo.doorCode} onChange={handleAccessInfoChange} className="mt-1 input-style" />
                    </div>
                    <div>
                        <label htmlFor="wifiPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Wi-Fi Password</label>
                        <input type="text" name="wifiPassword" id="wifiPassword" value={accessInfo.wifiPassword} onChange={handleAccessInfoChange} className="mt-1 input-style" />
                    </div>
                    <div>
                        <label htmlFor="lockboxCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lockbox Code / Location</label>
                        <input type="text" name="lockboxCode" id="lockboxCode" value={accessInfo.lockboxCode} onChange={handleAccessInfoChange} className="mt-1 input-style" />
                    </div>
                    <div>
                        <label htmlFor="parkingInstructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Parking Instructions</label>
                        <input type="text" name="parkingInstructions" id="parkingInstructions" value={accessInfo.parkingInstructions} onChange={handleAccessInfoChange} className="mt-1 input-style" />
                    </div>
                </div>
            </div>

            {/* House Rules Section */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">House Rules</h3>
                <textarea
                    name="houseRules"
                    value={houseRules}
                    onChange={(e) => setHouseRules(e.target.value)}
                    className="input-style w-full"
                    rows="6"
                    placeholder="e.g., No smoking, Quiet hours after 10 PM, etc."
                />
            </div>

            {/* Custom Information Section */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">Additional Information</h3>
                <div className="space-y-3">
                    {customInfo.map((item, index) => (
                        // FIXED: Removed conflicting 'block' class
                        <div key={index} className="flex items-center gap-2">
                            <input type="text" name="label" value={item.label} onChange={(e) => handleCustomInfoChange(index, e)} placeholder="Label (e.g., Trash Day)" className="input-style w-1/3" />
                            <input type="text" name="value" value={item.value} onChange={(e) => handleCustomInfoChange(index, e)} placeholder="Value (e.g., Tuesday morning)" className="input-style flex-grow" />
                            <button onClick={() => removeCustomInfoField(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={addCustomInfoField} className="mt-3 button-secondary text-sm">
                    <Plus size={16} className="mr-2"/> Add Custom Field
                </button>
            </div>


            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={onCancel} className="button-secondary">Cancel</button>
                <button onClick={handleSaveChanges} className="button-primary">Save Changes</button>
            </div>
        </div>
    );
};