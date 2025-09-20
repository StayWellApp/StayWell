// src/components/admin/ClientListWidget.js

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ChevronRight } from 'lucide-react';

const ClientListWidget = ({ onSelectClient, onViewAll }) => {
    const [recentClients, setRecentClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "users"),
            orderBy("createdAt", "desc"),
            limit(5)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentClients(clientsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Recent Clients</h3>
                <button onClick={onViewAll} className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                    View All
                </button>
            </div>
            {loading ? (
                <p className="text-gray-500 dark:text-gray-400">Loading clients...</p>
            ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentClients.map(client => (
                        <li key={client.id} onClick={() => onSelectClient(client)} className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg -mx-2 px-2">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 mr-4">
                                    {client.companyName ? client.companyName.charAt(0) : '?'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{client.companyName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{client.email}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ClientListWidget;