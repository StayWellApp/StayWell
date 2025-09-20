// src/components/admin/SuperAdminDashboard.js

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { PlusCircle } from 'lucide-react';

import ClientDetailView from './ClientDetailView';
import CustomerGrowthChart from './CustomerGrowthChart';
import RevenueByPlanChart from './RevenueByPlanChart';
import NewSignupsPanel from './NewSignupsPanel';
import SubscriptionsEndingSoon from './SubscriptionsEndingSoon';
import DashboardMetrics from './DashboardMetrics';
import AddClientModal from './AddClientModal';
import ClientListWidget from './ClientListWidget';

const SuperAdminDashboard = ({ onSelectClient: propOnSelectClient, setActiveView }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);

    useEffect(() => {
        // More specific query for clients (users who are owners)
        const q = query(collection(db, "users"), where("roles", "array-contains", "client_admin"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClients(clientsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching clients: ", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSelectClient = propOnSelectClient || setSelectedClient;

    if (selectedClient) {
        return <ClientDetailView client={selectedClient} onBack={() => setSelectedClient(null)} />;
    }

    if (loading) {
        return <div className="text-center p-8">Loading Dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Welcome, Admin!</h1>
                    <p className="text-gray-500 dark:text-gray-400">Here's a snapshot of your platform's performance.</p>
                </div>
                <button
                    onClick={() => setAddClientModalOpen(true)}
                    className="flex items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add New Client
                </button>
            </div>

            {/* Metrics */}
            <DashboardMetrics clients={clients} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Client List */}
                <div className="lg:col-span-2">
                    <ClientListWidget 
                        onSelectClient={handleSelectClient}
                        onViewAll={() => setActiveView('adminClients')}
                    />
                </div>
                
                {/* Sidebar: Signups and Subscriptions */}
                <div className="space-y-6">
                    <NewSignupsPanel clients={clients} />
                    <SubscriptionsEndingSoon clients={clients} />
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CustomerGrowthChart clients={clients} />
                <RevenueByPlanChart clients={clients} />
            </div>

            <AddClientModal 
                isOpen={isAddClientModalOpen} 
                onClose={() => setAddClientModalOpen(false)} 
            />
        </div>
    );
};

export default SuperAdminDashboard;