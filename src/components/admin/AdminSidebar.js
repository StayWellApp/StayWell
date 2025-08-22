import React from 'react';
import { LayoutDashboard, Users } from 'lucide-react';

const AdminSidebar = ({ activeView, setActiveView }) => {
    const navItems = [
        { id: 'adminDashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'adminClients', label: 'Clients', icon: Users },
        // Future admin links can be added here
    ];

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col flex-shrink-0">
            <div className="h-16 flex items-center px-6 border-b dark:border-gray-700">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeView === item.id
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <item.icon size={18} className="mr-3" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default AdminSidebar;