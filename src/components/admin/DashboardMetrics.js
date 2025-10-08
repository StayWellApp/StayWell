// staywellapp/staywell/StayWell-6e0b065d1897040a210dff5b77aa1b9a56a8c92f/src/components/admin/DashboardMetrics.js
import React from 'react';
import { Users, DollarSign, Repeat, Briefcase } from 'lucide-react';

const DashboardMetrics = ({ clients }) => {
    const totalClients = clients.length;
    const activeSubscriptions = clients.filter(c => c.subscription && c.subscription.status === 'active').length;
    const totalProperties = clients.reduce((acc, client) => acc + (client.propertyCount || 0), 0);
    const monthlyRecurringRevenue = clients.reduce((acc, client) => {
        if (client.subscription && client.subscription.status === 'active') {
            return acc + (client.subscription.price || 0);
        }
        return acc;
    }, 0);

    const metrics = [
        { title: 'Total Clients', value: totalClients, icon: Users },
        { title: 'Monthly Recurring Revenue', value: `$${monthlyRecurringRevenue.toFixed(2)}`, icon: DollarSign },
        { title: 'Active Subscriptions', value: activeSubscriptions, icon: Repeat },
        { title: 'Total Properties', value: totalProperties, icon: Briefcase },
    ];

    return (
        <div className="w-full h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                {metrics.map(metric => (
                    <div key={metric.title} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center h-full">
                        <div className="p-3 bg-indigo-100 dark:bg-gray-700 rounded-lg mr-4">
                            <metric.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{metric.title}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardMetrics;