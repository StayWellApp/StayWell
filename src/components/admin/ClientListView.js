import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Users, Building, Mail, Calendar } from 'lucide-react';

const ClientListView = ({ onSelectClient }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Query to get all users who are property owners/managers
        const q = query(collection(db, "users"), where("role", "==", "owner"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const clientsData = [];
            querySnapshot.forEach((doc) => {
                clientsData.push({ id: doc.id, ...doc.data() });
            });
            setClients(clientsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching clients:", err);
            setError("Failed to fetch clients. Make sure your Firestore security rules are correct.");
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="text-center p-8">Loading clients...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center mb-6">
                <Users className="mr-3 text-blue-500" size={24} />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Clients</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Company Name</th>
                            <th scope="col" className="px-6 py-3">Contact Email</th>
                            <th scope="col" className="px-6 py-3">Joined On</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((client) => (
                            <tr key={client.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer" onClick={() => onSelectClient(client)}>
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    <div className="flex items-center">
                                        <Building size={16} className="mr-2 text-gray-400" />
                                        {client.companyName || 'N/A'}
                                    </div>
                                </th>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <Mail size={16} className="mr-2 text-gray-400" />
                                        {client.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                     <div className="flex items-center">
                                        <Calendar size={16} className="mr-2 text-gray-400" />
                                        {client.createdAt ? new Date(client.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
                                        Active
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {clients.length === 0 && <p className="text-center py-8 text-gray-500">No clients found.</p>}
            </div>
        </div>
    );
};

export default ClientListView;