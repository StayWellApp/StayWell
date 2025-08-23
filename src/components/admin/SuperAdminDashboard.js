// staywellapp/staywell/StayWell-70115a3c7a3657dd4709bca4cc01a8d068f44fe5/src/components/admin/SuperAdminDashboard.js
import React, { useState } from 'react';
import DashboardMetrics from './DashboardMetrics';
import CustomerGrowthChart from './CustomerGrowthChart';
import RevenueByPlanChart from './RevenueByPlanChart';
import NewSignupsPanel from './NewSignupsPanel';
import SubscriptionsEndingSoon from './SubscriptionsEndingSoon';
import RecentActivity from './RecentActivity';
import ClientListView from './ClientListView';
import ClientDetailView from './ClientDetailView'; // <-- Import ClientDetailView

const SuperAdminDashboard = () => {
    const [selectedClient, setSelectedClient] = useState(null);

    return (
        <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Super Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardMetrics />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    {selectedClient ? (
                        <ClientDetailView client={selectedClient} onBack={() => setSelectedClient(null)} />
                    ) : (
                        <ClientListView onSelectClient={setSelectedClient} />
                    )}
                </div>
                <div className="space-y-8">
                    <CustomerGrowthChart />
                    <RevenueByPlanChart />
                    <NewSignupsPanel />
                    <SubscriptionsEndingSoon />
                    <RecentActivity />
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;