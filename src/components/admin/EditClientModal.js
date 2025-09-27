import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { X, Save, Building, User, Mail, Phone, MapPin, Hash } from 'lucide-react';

// --- FIX: InputField moved outside of the main component ---
// This component is now defined only once and won't be re-created on every render.
const InputField = ({ label, name, value, onChange, placeholder, type = "text", icon: Icon }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
                type={type}
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
        </div>
    </div>
);


const EditClientModal = ({ isOpen, onClose, client }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (client) {
            setFormData({
                companyName: client.companyName || '',
                fullName: client.fullName || '',
                email: client.email || '',
                phone: client.phone || '',
                country: client.country || '',
                billingAddress: client.billingAddress || '',
                vatNumber: client.vatNumber || ''
            });
        }
    }, [client]);

    if (!isOpen || !client) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const clientRef = doc(db, 'users', client.id);
        try {
            await updateDoc(clientRef, formData);
            toast.success("Client details updated successfully!");
            onClose();
        } catch (error) {
            console.error("Error updating client: ", error);
            toast.error("Failed to update client details.");
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex justify-center items-center p-4 transition-opacity">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Client Details</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. StayWell Inc." icon={Building} />
                            <InputField label="Contact Name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. John Doe" icon={User} />
                            <InputField label="Email Address" name="email" value={formData.email} onChange={handleChange} placeholder="e.g. john.doe@example.com" type="email" icon={Mail} />
                            <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. +1 234 567 890" icon={Phone} />
                            <div className="md:col-span-2">
                                <InputField label="Billing Address" name="billingAddress" value={formData.billingAddress} onChange={handleChange} placeholder="e.g. 123 Main St, Anytown, USA" icon={MapPin} />
                            </div>
                            <InputField label="VAT Number" name="vatNumber" value={formData.vatNumber} onChange={handleChange} placeholder="e.g. GB123456789" icon={Hash} />
                            <InputField label="Country" name="country" value={formData.country} onChange={handleChange} placeholder="e.g. United States" icon={MapPin} />
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                         <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                            Cancel
                        </button>
                        <button type="submit" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                            <Save className="h-4 w-4 mr-2" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditClientModal;