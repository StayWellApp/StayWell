// src/components/admin/NewSignupsPanel.js
import React from 'react';
import moment from 'moment';
import { UserPlus } from 'lucide-react';
import DashboardWidget from './DashboardWidget'; // Import the wrapper

const NewSignupsPanel = ({ clients, loading }) => {
    const newSignups = clients
        .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
        .slice(0, 5);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-3 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                            <div className="flex-grow">
                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (newSignups.length === 0) {
            return (
                <div className="text-center py-6 h-full flex flex-col justify-center items-center">
                    <UserPlus className="mx-auto h-10 w-10 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No New Signups</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Recent signups will be shown here.</p>
                </div>
            );
        }
        
        return (
            <ul className="space-y-3">
                {newSignups.map(client => (
                    <li key={client.id} className="flex items-center">
                         <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-700 flex items-center justify-center font-bold text-green-600 dark:text-green-300 mr-3 flex-shrink-0">
                            {client.companyName ? client.companyName.charAt(0) : '?'}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{client.companyName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{client.createdAt ? moment(client.createdAt.toDate()).format('MMM D, YYYY') : 'Date unknown'}</p>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    // Use the DashboardWidget wrapper
    return (
        <DashboardWidget title="New Signups">
            {renderContent()}
        </DashboardWidget>
    );
};

export default NewSignupsPanel;