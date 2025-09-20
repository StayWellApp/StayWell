// src/components/admin/DashboardMetrics.js

import React from 'react';
import { Users, Building, DollarSign, Clock } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const DashboardMetrics = ({ clients }) => {
    const totalClients = clients.length;
    // Dummy data for other metrics - replace with real data when available
    const activeProperties = clients.reduce((acc, client) => acc + (client.propertyCount || 0), 0);
    const monthlyRevenue = 5650; // Example
    const pendingTasks = 12;      // Example

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Clients" value={totalClients} icon={Users} color="bg-blue-500" />
            <StatCard title="Active Properties" value={activeProperties} icon={Building} color="bg-green-500" />
            <StatCard title="Monthly Revenue" value={`$${monthlyRevenue.toLocaleString()}`} icon={DollarSign} color="bg-purple-500" />
            <StatCard title="Pending Tasks" value={pendingTasks} icon={Clock} color="bg-orange-500" />
        </div>
    );
};

export default DashboardMetrics;