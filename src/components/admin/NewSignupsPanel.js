import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { UserPlus } from 'lucide-react';

const NewSignupsPanel = ({ onSelectClient }) => {
    const [newClients, setNewClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "users"),
            where("subscription.status", "==", "trialing")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNewClients(clients);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const daysLeft = (timestamp) => {
        if (!timestamp) return 'N/A';
        const renewalDate = timestamp.toDate();
        const today = new Date();
        const diffTime = renewalDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Expired';
        return `${diffDays} days left`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                <UserPlus size={20} className="mr-3 text-purple-500" />
                New Client Trials
            </h3>
            {loading ? <p>Loading...</p> : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {newClients.length > 0 ? newClients.map(client => (
                        <li key={client.id} className="py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md px-2 -mx-2 cursor-pointer" onClick={() => onSelectClient(client)}>
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-100">{client.companyName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                    {daysLeft(client.subscription.renewalDate)}
                                </p>
                            </div>
                        </li>
                    )) : <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No new clients are currently on a trial.</p>}
                </ul>
            )}
        </div>
    );
};

export default NewSignupsPanel;