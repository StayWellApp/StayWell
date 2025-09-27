import React from 'react';
// --- FIX: Imported Briefcase icon for the new metric ---
import { Users, DollarSign, Repeat, Briefcase } from 'lucide-react';

const DashboardMetrics = ({ clients }) => {
    const totalClients = clients.length;
    
    const activeSubscriptions = clients.filter(c => c.subscription && c.subscription.status === 'active').length;

    // --- FIX: New metric calculation for total properties ---
    // This assumes each client object has a 'propertyCount' field.
    // If not, you might need to calculate this differently based on your data structure.
    const totalProperties = clients.reduce((acc, client) => acc + (client.propertyCount || 0), 0);
    
    // NOTE: This is a placeholder calculation. You'll need to implement
    // the actual logic based on your subscription data structure.
    const monthlyRecurringRevenue = clients.reduce((acc, client) => {
        if (client.subscription && client.subscription.status === 'active') {
            return acc + (client.subscription.price || 0);
        }
        return acc;
    }, 0);

    // --- FIX: Updated the metrics array, replacing "Pending Tasks" ---
    const metrics = [
        { title: 'Total Clients', value: totalClients, icon: Users },
        { title: 'Monthly Recurring Revenue', value: `$${monthlyRecurringRevenue.toFixed(2)}`, icon: DollarSign },
        { title: 'Active Subscriptions', value: activeSubscriptions, icon: Repeat },
        { title: 'Total Properties', value: totalProperties, icon: Briefcase }, // New metric
    ];

    return (
        // --- FIX: Changed grid layout to accommodate four metrics ---
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
    );
};

export default DashboardMetrics;