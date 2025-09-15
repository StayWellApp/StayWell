import React from 'react';
import { ChartBarIcon, CurrencyDollarIcon, HomeModernIcon } from '@heroicons/react/24/outline';

const PlaceholderChart = ({ title }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg w-full h-64 flex items-center justify-center">
            <ChartBarIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-500 dark:text-gray-400 ml-4">Chart data would be displayed here.</p>
        </div>
    </div>
);

const MetricCard = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center gap-4 border dark:border-gray-700">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
            <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);


const ClientAnalyticsView = ({ client, properties }) => {
  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Key Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard title="Monthly Revenue" value="$0" icon={CurrencyDollarIcon} />
                <MetricCard title="Total Properties" value={properties.length} icon={HomeModernIcon} />
                <MetricCard title="Task Completion" value="0%" icon={ChartBarIcon} />
            </div>
        </div>

        <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Analytics Charts</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlaceholderChart title="Revenue Over Time" />
                <PlaceholderChart title="Occupancy Rate" />
            </div>
        </div>
    </div>
  );
};

export default ClientAnalyticsView;