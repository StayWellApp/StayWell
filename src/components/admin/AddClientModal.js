import React, { useState } from 'react';
import { functions, db } from '../../firebase-config';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AddClientModal = ({ isOpen, onClose, onClientAdded }) => {
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [plan, setPlan] = useState('basic');
    const [planExpiration, setPlanExpiration] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAddClient = async () => {
        if (!companyName || !email) {
            setError("Company Name and Email are required.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // 1. Call Cloud Function to handle Auth account creation
            const createClientFunc = httpsCallable(functions, 'createClient');
            await createClientFunc({ 
                companyName, 
                email, 
                plan, 
                planExpiration, 
                contactPerson 
            });

            // 2. Fallback/Double-check: Manually ensure the client record exists in Firestore if function succeeds
            // (Note: Usually your Cloud Function should handle this, but adding it here if you 
            // want to be sure the client collection is populated for the dashboard list)
            
            onClientAdded();
            onClose();
            // Clear form
            setCompanyName('');
            setEmail('');
            setContactPerson('');
        } catch (err) {
            console.error("Error adding client:", err);
            setError(err.message || "Failed to create client. Ensure the Cloud Function is deployed.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Add New Client</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4 text-sm">{error}</p>}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Acme Corp"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
                        <input
                            type="email"
                            placeholder="client@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Contact Person</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subscription Plan</label>
                        <select
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Expiration</label>
                        <input
                            type="date"
                            value={planExpiration}
                            onChange={(e) => setPlanExpiration(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200">Cancel</button>
                    <button onClick={handleAddClient} disabled={loading} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:bg-indigo-400">
                        {loading ? 'Adding...' : 'Add Client'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddClientModal;