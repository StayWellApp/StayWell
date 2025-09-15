// src/components/admin/ClientListWidget.js

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase-config';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { ArrowRight } from 'lucide-react';

const ClientListWidget = ({ onSelectClient, onViewAll }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetches the 5 most recently created clients
  useEffect(() => {
    const q = query(
      collection(db, "users"), 
      where("role", "==", "owner"), 
      orderBy("createdAt", "desc"), 
      limit(5)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching recent clients: ", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const renderCell = (client, columnKey) => {
    const cellValue = client[columnKey];
    switch (columnKey) {
      case 'companyName':
        return (
          <div className="flex items-center">
            <img className="h-8 w-8 rounded-full mr-3 object-cover" src={client.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.companyName)}&background=random`} alt={`${client.companyName} logo`} />
            <span className="font-medium text-gray-900 dark:text-white truncate">{cellValue}</span>
          </div>
        );
      case 'status':
        const statusColor = cellValue === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusColor}`}>{cellValue}</span>;
      default:
        return cellValue || 'N/A';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg h-full flex flex-col">
        {/* Simplified Table */}
        <div className="overflow-x-auto flex-grow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                <tr><td colSpan="2" className="text-center p-4">Loading...</td></tr>
                ) : clients.length === 0 ? (
                <tr><td colSpan="2" className="text-center p-4">No recent clients.</td></tr>
                ) : (
                clients.map((client) => (
                    <tr key={client.id} onClick={() => onSelectClient && onSelectClient(client)} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{renderCell(client, 'companyName')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{renderCell(client, 'status')}</td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
        {/* View All Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
                onClick={onViewAll}
                className="w-full text-center px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-md flex items-center justify-center"
            >
                View All Clients <ArrowRight className="h-4 w-4 ml-2" />
            </button>
        </div>
    </div>
  );
};

export default ClientListWidget;