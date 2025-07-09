// --- src/components/Layout.js ---
// Create this new file. It defines the main structure with a vertical sidebar.

import React from 'react';
import { LayoutDashboard, Home, Calendar, Settings, Users, LogOut } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView, onLogout }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'properties', label: 'Properties', icon: <Home size={20} /> },
        { id: 'calendar', label: 'Master Calendar', icon: <Calendar size={20} /> },
        { id: 'team', label: 'Team', icon: <Users size={20} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    ];

    return (
        <aside className="w-64 flex-shrink-0 bg-gray-800 text-gray-200 flex flex-col">
            <div className="h-16 flex items-center justify-center text-2xl font-bold text-white border-b border-gray-700">
                StayWell
            </div>
            <nav className="flex-grow px-4 py-6">
                <ul className="space-y-2">
                    {navItems.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveView(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                                    activeView === item.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

const Layout = ({ children, activeView, setActiveView, onLogout }) => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;
