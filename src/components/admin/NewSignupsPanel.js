// src/components/admin/NewSignupsPanel.js

import React from 'react';
import moment from 'moment';

const NewSignupsPanel = ({ clients }) => {
    const newSignups = clients
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, 5);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">New Signups</h3>
            <ul className="space-y-3">
                {newSignups.map(client => (
                    <li key={client.id} className="flex items-center">
                         <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-700 flex items-center justify-center font-bold text-green-600 dark:text-green-300 mr-3 flex-shrink-0">
                            {client.companyName ? client.companyName.charAt(0) : '?'}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{client.companyName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{moment(client.createdAt.toDate()).format('MMM D, YYYY')}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default NewSignupsPanel;