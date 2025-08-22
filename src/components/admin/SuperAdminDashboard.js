import React from 'react';
import DashboardMetrics from './DashboardMetrics';
import SubscriptionsEndingSoon from './SubscriptionsEndingSoon';
import RecentActivity from './RecentActivity';
import CustomerGrowthChart from './CustomerGrowthChart';
import NewSignupsPanel from './NewSignupsPanel';

// Note: This component is now only the main dashboard view.
// ClientList and ClientDetail are rendered directly by App.js
const SuperAdminDashboard = ({ user }) => {
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Super Admin Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome, {user.email}.</p>
            </header>

            <main className="space-y-8">
                <DashboardMetrics />
                <CustomerGrowthChart />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <NewSignupsPanel />
                    <SubscriptionsEndingSoon />
                </div>
                 <RecentActivity />
            </main>
        </div>
    );
};

export default SuperAdminDashboard;