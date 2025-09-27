import React from 'react';
// --- FIX: Import NavLink ---
import { NavLink } from 'react-router-dom';
import { Home, Users, CreditCard, DollarSign, FileText, Settings } from 'lucide-react';

const AdminSidebar = () => {
    const navItems = [
        { to: "/admin/dashboard", label: "Dashboard", icon: Home },
        { to: "/admin/clients", label: "Clients", icon: Users },
        { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
        { to: "/admin/billing", label: "Billing", icon: DollarSign },
        { to: "/admin/audit-log", label: "Audit Log", icon: FileText },
    ];

    const baseClasses = "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors";
    const inactiveClasses = "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";
    const activeClasses = "bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-white";

    return (
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {/* --- FIX: Use NavLink for routing --- */}
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                    >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <NavLink to="/admin/settings" className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                </NavLink>
            </div>
        </div>
    );
};

export default AdminSidebar;