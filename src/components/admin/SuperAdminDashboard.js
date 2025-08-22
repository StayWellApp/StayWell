import React, { useState } from 'react';
import ClientListView from './ClientListView';
import ClientDetailView from './ClientDetailView';
import DashboardMetrics from './DashboardMetrics';
import SubscriptionsEndingSoon from './SubscriptionsEndingSoon'; // Import new panel
import RecentActivity from './RecentActivity'; // Import new panel

const SuperAdminDashboard = ({ user, initialView }) => {
    const [selectedClient, setSelectedClient] = useState(null);

    // Simplified view logic
    if (initialView === 'clients' && !selectedClient) {
        return (
            <div className="p-4 sm:p-6 md:p-8">
                <ClientListView onSelectClient={setSelectedClient} />
            </div>
        );
    }
    
    if (selectedClient) {
        return (
            <div className="p-4 sm:p-6 md:p-8">
                <ClientDetailView client={selectedClient} onBack={() => setSelectedClient(null)} />
            </div>
        );
    }

    // Default Dashboard View
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Super Admin Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome, {user.email}.</p>
            </header>

            <main className="space-y-8">
                <DashboardMetrics />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SubscriptionsEndingSoon />
                    <RecentActivity />
                </div>
            </main>
        </div>
    );
};

export default SuperAdminDashboard;