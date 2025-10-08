// src/components/admin/SubscriptionsEndingSoon.js
import React from 'react';
import moment from 'moment';
import { BellRing } from 'lucide-react';
import DashboardWidget from './DashboardWidget'; // Import the wrapper

const SubscriptionsEndingSoon = ({ clients, loading }) => {
    // Dummy data - replace with real subscription logic
    const endingSoon = clients.slice(0, 3).map(c => ({...c, endsAt: moment().add(Math.floor(Math.random() * 30), 'days')}));
    
    const renderContent = () => {
        if (loading) {
            return (
                 <div className="space-y-3 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex-grow">
                                <div className="h-4 w-2/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
                            </div>
                            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        </div>
                    ))}
                </div>
            );
        }

        if (endingSoon.length === 0) {
            return (
                <div className="text-center py-6 h-full flex flex-col justify-center items-center">
                    <BellRing className="mx-auto h-10 w-10 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">All Good!</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No subscriptions are ending soon.</p>
                </div>
            );
        }

        return (
            <ul className="space-y-3">
                {endingSoon.map(client => (
                    <li key={client.id} className="flex items-center justify-between">
                        <div>
                           <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{client.companyName}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400">Ends on {client.endsAt.format('MMM D')}</p>
                        </div>
                        <span className="text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-900 dark:text-orange-300 py-1 px-2 rounded-full">
                           {client.endsAt.diff(moment(), 'days')} days
                        </span>
                    </li>
                ))}
            </ul>
        );
    };

    // Use the DashboardWidget wrapper
    return (
        <DashboardWidget title="Subscriptions Ending Soon">
            {renderContent()}
        </DashboardWidget>
    );
};

export default SubscriptionsEndingSoon;