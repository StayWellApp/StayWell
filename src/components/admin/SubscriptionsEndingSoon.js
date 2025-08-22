import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { AlertTriangle } from 'lucide-react';

const SubscriptionsEndingSoon = () => {
    const [expiringClients, setExpiringClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const today = Timestamp.now();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const cutoffDate = Timestamp.fromDate(thirtyDaysFromNow);

        const q = query(
            collection(db, "users"),
            where("subscription.status", "==", "active"),
            where("subscription.renewalDate", "<=", cutoffDate)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExpiringClients(clients);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const daysUntil = (timestamp) => {
        if (!timestamp) return 'N/A';
        const renewalDate = timestamp.toDate();
        const today = new Date();
        const diffTime = renewalDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 0 ? 'Today' : `${diffDays} days`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Subscriptions Ending Soon</h3>
            {loading ? <p>Loading...</p> : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {expiringClients.length > 0 ? expiringClients.map(client => (
                        <li key={client.id} className="py-3 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-100">{client.companyName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{client.subscription.planName} Plan</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-red-500 dark:text-red-400 flex items-center">
                                    <AlertTriangle size={14} className="mr-2" />
                                    {daysUntil(client.subscription.renewalDate)}
                                </p>
                            </div>
                        </li>
                    )) : <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No subscriptions are ending soon.</p>}
                </ul>
            )}
        </div>
    );
};

export default SubscriptionsEndingSoon;