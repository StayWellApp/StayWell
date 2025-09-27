import React from 'react';
import { BarChart2 } from 'lucide-react';

const ClientAnalyticsView = ({ client }) => {
    return (
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Client Analytics</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This feature is coming soon.
            </p>
        </div>
    );
};

export default ClientAnalyticsView;