import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { FileClock } from 'lucide-react';

const RecentActivity = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "auditLog"), orderBy("timestamp", "desc"), limit(5));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Admin Activity</h3>
            {loading ? <p>Loading...</p> : (
                 <ul className="space-y-4">
                    {logs.length > 0 ? logs.map(log => (
                        <li key={log.id} className="flex items-start space-x-3">
                            <FileClock className="text-gray-400 mt-1 flex-shrink-0" size={16} />
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{log.action}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {log.adminEmail} - {formatDate(log.timestamp)}
                                </p>
                            </div>
                        </li>
                    )) : <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No recent activity.</p>}
                </ul>
            )}
        </div>
    );
};

export default RecentActivity;