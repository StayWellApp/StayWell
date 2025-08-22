import React, { useState, useEffect } from 'react';
import ClientListView from './ClientListView';
import ClientDetailView from './ClientDetailView';
import DashboardMetrics from './DashboardMetrics';

const SuperAdminDashboard = ({ user, initialView }) => {
    const [selectedClient, setSelectedClient] = useState(null);
    const [currentView, setCurrentView] = useState('dashboard');

    useEffect(() => {
        if (initialView === 'clients') {
            setCurrentView('clients');
        }
    }, [initialView]);

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setCurrentView('clientDetail');
    };

    const handleBackToList = () => {
        setSelectedClient(null);
        setCurrentView('clients');
    };

    const renderContent = () => {
        if (selectedClient) {
            return <ClientDetailView client={selectedClient} onBack={handleBackToList} />;
        }
        // This is not a great way to handle routing, but works for now.
        // We can refactor this later if needed.
        if (initialView === 'clients') {
            return <ClientListView onSelectClient={handleSelectClient} />;
        }
        
        return (
            <>
                <DashboardMetrics />
                <ClientListView onSelectClient={handleSelectClient} />
            </>
        );
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Super Admin Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome, {user.email}.</p>
            </header>

            <main className="space-y-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default SuperAdminDashboard;