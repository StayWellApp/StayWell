// --- src/components/Layout.js ---
// This is the complete, updated code for your main Layout component.

import React, { useState } from 'react';
import { Home, Building, Calendar, Users, Settings, Package, LogOut, Menu, X, ListChecks } from 'lucide-react'; // <-- 1. IMPORT ListChecks icon

const Layout = ({ user, userRole, activeView, setActiveView, onLogout, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* --- Sidebar --- */}
            <aside className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-64 flex-shrink-0 flex-col border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex fixed md:relative z-30 md:z-auto h-full`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">StayWell</h1>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-2">
                    <NavItem icon={<Home size={20} />} text="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
                    <NavItem icon={<Building size={20} />} text="Properties" active={activeView === 'properties'} onClick={() => setActiveView('properties')} />
                    <NavItem icon={<ListChecks size={20} />} text="Templates" active={activeView === 'templates'} onClick={() => setActiveView('templates')} /> {/* <-- 2. ADD Templates NavItem */}
                    <NavItem icon={<Calendar size={20} />} text="Master Calendar" active={activeView === 'calendar'} onClick={() => setActiveView('calendar')} />
                    <NavItem icon={<Users size={20} />} text="Team" active={activeView === 'team'} onClick={() => setActiveView('team')} />
                    <NavItem icon={<Package size={20} />} text="Storage" active={activeView === 'storage'} onClick={() => setActiveView('storage')} />
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <NavItem icon={<Settings size={20} />} text="Settings" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
                    <div className="mt-4 p-3 rounded-lg flex items-center justify-between bg-gray-100 dark:bg-gray-700/50">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
                                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-semibold truncate">{user.displayName || user.email}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{userRole}</p>
                            </div>
                        </div>
                         <button onClick={onLogout} title="Logout" className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- Main Content --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-gray-800 shadow-sm md:hidden p-4">
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-300">
                        <Menu size={24} />
                    </button>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

// --- NavItem Helper Component ---
const NavItem = ({ icon, text, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
            active
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
    >
        {icon}
        <span className="ml-3">{text}</span>
    </button>
);

export default Layout;
