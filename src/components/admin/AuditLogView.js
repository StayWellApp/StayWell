import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { FileClock } from 'lucide-react';

const AuditLogView = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "auditLog"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const logsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLogs(logsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">A record of all administrative actions taken.</p>
            </header>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                {loading ? (
                    <p>Loading audit log...</p>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.map(log => (
                            <li key={log.id} className="py-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                        <FileClock className="text-blue-600 dark:text-blue-300" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{log.action}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            By: {log.adminEmail} on {formatDate(log.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                 {logs.length === 0 && !loading && <p className="text-center py-8 text-gray-500">No audit records found.</p>}
            </div>
        </div>
    );
};

export default AuditLogView;