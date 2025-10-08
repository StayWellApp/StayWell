// staywellapp/staywell/StayWell-6e0b065d1897040a210dff5b77aa1b9a56a8c92f/src/components/admin/ClientListWidget.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Inbox } from 'lucide-react';
import DashboardWidget from './DashboardWidget'; // Import the shared wrapper

const SkeletonItem = () => (
    <div className="py-3 flex items-center justify-between animate-pulse">
        <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
            <div>
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
            </div>
        </div>
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
);

const ClientListWidget = ({ clients, loading, onViewAll }) => {
    const navigate = useNavigate();

    const renderContent = () => {
        if (loading) {
            return (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {[...Array(5)].map((_, i) => <li key={i}><SkeletonItem /></li>)}
                </ul>
            );
        }

        if (!clients || clients.length === 0) {
            return (
                <div className="text-center py-10 h-full flex flex-col justify-center items-center">
                    <Inbox className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No Clients Found</h3>
                </div>
            );
        }

        return (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {clients.slice(0, 5).map(client => (
                    <li 
                        key={client.id} 
                        onClick={() => navigate(`/admin/clients/${client.id}`)} 
                        className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg -mx-2 px-2 transition-colors"
                    >
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 mr-4 flex-shrink-0">
                                {client.companyName ? client.companyName.charAt(0) : '?'}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{client.companyName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{client.email}</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <DashboardWidget title="Clients" onViewAll={onViewAll}>
            {renderContent()}
        </DashboardWidget>
    );
};

export default ClientListWidget;