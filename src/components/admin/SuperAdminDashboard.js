import React, { useState } from 'react';
import ClientListView from './ClientListView';
import ClientDetailView from './ClientDetailView';
import DashboardMetrics from './DashboardMetrics'; // Import the new component

const SuperAdminDashboard = ({ user }) => {
    const [selectedClient, setSelectedClient] = useState(null);

    const handleSelectClient = (client) => {
        setSelectedClient(client);
    };

    const handleBackToList = () => {
        setSelectedClient(null);
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Super Admin Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome, {user.email}.</p>
            </header>

            <main className="space-y-8">
                {selectedClient ? (
                    <ClientDetailView client={selectedClient} onBack={handleBackToList} />
                ) : (
                    <>
                        {/* Add the metrics component here */}
                        <DashboardMetrics />
                        <ClientListView onSelectClient={handleSelectClient} />
                    </>
                )}
            </main>
        </div>
    );
};

export default SuperAdminDashboard;