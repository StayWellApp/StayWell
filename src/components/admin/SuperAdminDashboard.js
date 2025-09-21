// src/components/admin/SuperAdminDashboard.js

import React, { useState, useEffect } from 'react';
import { PlusCircle, X } from 'lucide-react';
import moment from 'moment';

import DateRangeFilter from './DateRangeFilter';
import ClientDetailView from './ClientDetailView';
import CustomerGrowthChart from './CustomerGrowthChart';
import RevenueByPlanChart from './RevenueByPlanChart';
import NewSignupsPanel from './NewSignupsPanel';
import SubscriptionsEndingSoon from './SubscriptionsEndingSoon';
import DashboardMetrics from './DashboardMetrics';
import AddClientModal from './AddClientModal';
import ClientListWidget from './ClientListWidget';

const SuperAdminDashboard = ({ allClients, loading, onSelectClient, setActiveView }) => {
    const [filteredClients, setFilteredClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);
    const [dateRangeStart, setDateRangeStart] = useState(null);
    const [chartFilter, setChartFilter] = useState(null);

    useEffect(() => {
        let clientsToFilter = [...allClients];

        if (dateRangeStart) {
            clientsToFilter = clientsToFilter.filter(client => 
                client.createdAt && client.createdAt.toDate() >= dateRangeStart
            );
        }

        if (chartFilter) {
            if (chartFilter.type === 'date') {
                 clientsToFilter = clientsToFilter.filter(client => 
                    client.createdAt && moment(client.createdAt.toDate()).format('YYYY-MM') === chartFilter.value
                );
            }
        }
        
        setFilteredClients(clientsToFilter);
    }, [allClients, dateRangeStart, chartFilter]);

    const handleChartBarClick = (data) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const month = data.activePayload[0].payload.month;
            setChartFilter({ type: 'date', value: month, label: `Month: ${month}` });
        }
    };

    const clearChartFilter = () => setChartFilter(null);

    if (selectedClient) {
        return <ClientDetailView client={selectedClient} onBack={() => setSelectedClient(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Welcome, Admin!</h1>
                    <p className="text-gray-500 dark:text-gray-400">Here's a snapshot of your platform's performance.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <DateRangeFilter onDateChange={setDateRangeStart} />
                    <button onClick={() => setAddClientModalOpen(true)} className="flex items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700">
                        <PlusCircle className="h-5 w-5 mr-2" /> Add New Client
                    </button>
                </div>
            </div>

            {chartFilter && (
                <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg flex justify-between items-center">
                    <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">Filtering by - {chartFilter.label}</p>
                    <button onClick={clearChartFilter} className="p-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800">
                        <X className="h-5 w-5 text-indigo-600 dark:text-indigo-300"/>
                    </button>
                </div>
            )}

            <DashboardMetrics clients={filteredClients} loading={loading} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ClientListWidget clients={filteredClients} loading={loading} onSelectClient={setSelectedClient} onViewAll={() => setActiveView('adminClients')} />
                </div>
                <div className="space-y-6">
                    <NewSignupsPanel clients={filteredClients} loading={loading} />
                    <SubscriptionsEndingSoon clients={filteredClients} loading={loading} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CustomerGrowthChart clients={allClients} loading={loading} onBarClick={handleChartBarClick} />
                <RevenueByPlanChart clients={allClients} loading={loading} />
            </div>

            <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setAddClientModalOpen(false)} />
        </div>
    );
};

export default SuperAdminDashboard;