// src/components/admin/EditClientModal.js

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { X } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';

// A simple list of countries for the dropdown
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  // Add more countries as needed
];

const EditClientModal = ({ isOpen, onClose, client, onSave }) => {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Pre-fill form when a client is provided
    if (client) {
      setFormData({
        companyName: client.companyName || '',
        contactName: client.contactName || '',
        email: client.email || '',
        phone: client.phone || '',
        subscriptionTier: client.subscriptionTier || 'basic',
        status: client.status || 'active',
        countryCode: client.countryCode || '',
      });
    }
  }, [client]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client || !client.id) {
        toast.error("No client selected for editing.");
        return;
    }

    setIsLoading(true);
    try {
      const clientDocRef = doc(db, 'users', client.id);
      await updateDoc(clientDocRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      toast.success("Client updated successfully!");
      onSave({ ...client, ...formData }); // Update parent state
      onClose();
    } catch (error) {
      console.error("Error updating client: ", error);
      toast.error("Failed to update client.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Edit Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Name</label>
            <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
            <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 shadow-sm">
              <option value="">Select a country</option>
              {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">{isLoading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default EditClientModal;