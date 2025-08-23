// staywellapp/staywell/StayWell-70115a3c7a3657dd4709bca4cc01a8d068f44fe5/src/components/admin/ClientListView.js
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Users, Building, Mail, Calendar, Search, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import AddClientModal from './AddClientModal';

const ClientListView = ({ onSelectClient }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'companyName', direction: 'ascending' });
    const [visibleColumns, setVisibleColumns] = useState({
        companyName: true,
        contactEmail: true,
        joinedOn: true,
        properties: true,
        plan: true,
        planExpires: true,
        status: true,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);


    useEffect(() => {
        const q = query(collection(db, "users"), where("role", "==", "owner"));

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const clientsData = [];
            for (const doc of querySnapshot.docs) {
                const userData = doc.data();
                // Fetch property count
                const propertiesQuery = query(collection(db, "properties"), where("ownerId", "==", doc.id));
                const propertiesSnapshot = await getDocs(propertiesQuery);
                const propertyCount = propertiesSnapshot.size;

                clientsData.push({
                    id: doc.id,
                    ...userData,
                    propertyCount: propertyCount,
                    plan: userData.subscription?.plan || 'N/A',
                    planExpires: userData.subscription?.expiresAt,
                });
            }
            setClients(clientsData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching clients:", err);
            setError("Failed to fetch clients.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const sortedAndFilteredClients = useMemo(() => {
        let sortableItems = [...clients];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems.filter(client =>
            client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, sortConfig, searchTerm]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const toggleColumn = (key) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) return <div className="text-center p-8">Loading clients...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    const columns = [
        { key: 'companyName', label: 'Company Name' },
        { key: 'contactEmail', label: 'Contact Email' },
        { key: 'joinedOn', label: 'Joined On' },
        { key: 'properties', label: 'Properties' },
        { key: 'plan', label: 'Plan' },
        { key: 'planExpires', label: 'Plan Expires' },
        { key: 'status', label: 'Status' },
    ];


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <AddClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onClientAdded={() => { /* You might want to refresh the list or show a success message */ }}
            />
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <Users className="mr-3 text-blue-500" size={24} />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Clients</h2>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-64 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <div className="relative inline-block text-left">
                        {/* Column visibility dropdown would be here */}
                    </div>
                     <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        <PlusCircle size={18} className="mr-2" />
                        Add Client
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            {columns.map(col => visibleColumns[col.key] && (
                                <th key={col.key} scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort(col.key)}>
                                    <div className="flex items-center">
                                        {col.label}
                                        {sortConfig.key === col.key ? (
                                            sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                        ) : null}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredClients.map((client) => (
                            <tr key={client.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer" onClick={() => onSelectClient(client)}>
                                {visibleColumns.companyName && <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"><div className="flex items-center"><Building size={16} className="mr-2 text-gray-400" />{client.companyName || 'N/A'}</div></th>}
                                {visibleColumns.contactEmail && <td className="px-6 py-4"><div className="flex items-center"><Mail size={16} className="mr-2 text-gray-400" />{client.email}</div></td>}
                                {visibleColumns.joinedOn && <td className="px-6 py-4"><div className="flex items-center"><Calendar size={16} className="mr-2 text-gray-400" />{client.createdAt ? new Date(client.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</div></td>}
                                {visibleColumns.properties && <td className="px-6 py-4 text-center">{client.propertyCount}</td>}
                                {visibleColumns.plan && <td className="px-6 py-4">{client.plan}</td>}
                                {visibleColumns.planExpires && <td className="px-6 py-4">{client.planExpires ? new Date(client.planExpires.seconds * 1000).toLocaleDateString() : 'N/A'}</td>}
                                {visibleColumns.status && <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">Active</span></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedAndFilteredClients.length === 0 && <p className="text-center py-8 text-gray-500">No clients found.</p>}
            </div>
        </div>
    );
};

export default ClientListView;