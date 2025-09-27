import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { X, Save } from 'lucide-react';

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
                // Initialize new billing fields
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

    const InputField = ({ label, name, value, onChange, placeholder, type = "text" }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <input
                type={type}
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
        </div>
    );


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Client Details</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. StayWell Inc." />
                        <InputField label="Contact Name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. John Doe" />
                        <InputField label="Email Address" name="email" value={formData.email} onChange={handleChange} placeholder="e.g. john.doe@example.com" type="email"/>
                        <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. +1 234 567 890" />
                        <InputField label="Country" name="country" value={formData.country} onChange={handleChange} placeholder="e.g. United States" />
                        <InputField label="Billing Address" name="billingAddress" value={formData.billingAddress} onChange={handleChange} placeholder="e.g. 123 Main St, Anytown, USA" />
                        <InputField label="VAT Number" name="vatNumber" value={formData.vatNumber} onChange={handleChange} placeholder="e.g. GB123456789" />
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button type="submit" className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                            <Save className="h-4 w-4 mr-2" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditClientModal;