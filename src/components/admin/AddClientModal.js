// staywellapp/staywell/StayWell-70115a3c7a3657dd4709bca4cc01a8d068f44fe5/src/components/admin/AddClientModal.js
import React, { useState } from 'react';
import { functions } from '../../firebase-config';
import { httpsCallable } from 'firebase/functions';

const AddClientModal = ({ isOpen, onClose, onClientAdded }) => {
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [contactPerson, setContactPerson] = useState(''); // New state
    const [plan, setPlan] = useState('basic');
    const [planExpiration, setPlanExpiration] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAddClient = async () => {
        setLoading(true);
        setError(null);
        try {
            const createClient = httpsCallable(functions, 'createClient');
            // Pass the new fields to the cloud function
            await createClient({ companyName, email, plan, planExpiration, contactPerson });
            onClientAdded();
            onClose();
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Add New Client</h2>
                {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                        type="email"
                        placeholder="Contact Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    {/* New input for Contact Person */}
                    <input
                        type="text"
                        placeholder="Key Contact Person"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    >
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                    <input
                        type="date"
                        placeholder="Plan Expiration"
                        value={planExpiration}
                        onChange={(e) => setPlanExpiration(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Cancel</button>
                    <button onClick={handleAddClient} disabled={loading} className="px-4 py-2 rounded bg-blue-500 text-white disabled:bg-blue-300">
                        {loading ? 'Adding...' : 'Add Client'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddClientModal;