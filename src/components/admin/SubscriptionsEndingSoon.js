// src/components/admin/SubscriptionsEndingSoon.js

import React from 'react';
import moment from 'moment';

const SubscriptionsEndingSoon = ({ clients }) => {
    // Dummy data - replace with real subscription logic
    const endingSoon = clients.slice(0, 3).map(c => ({...c, endsAt: moment().add(Math.floor(Math.random() * 30), 'days')}));

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Subscriptions Ending Soon</h3>
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
        </div>
    );
};

export default SubscriptionsEndingSoon;