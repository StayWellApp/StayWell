// --- src/components/Layout.js ---
// Replace the entire contents of your Layout.js file with this code.

import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Home, Calendar, Settings, Users, LogOut, User, Globe, ChevronDown } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'properties', label: 'Properties', icon: <Home size={20} /> },
        { id: 'calendar', label: 'Master Calendar', icon: <Calendar size={20} /> },
        { id: 'team', label: 'Team', icon: <Users size={20} /> },
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
                    onClick={() => setActiveView('settings')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                        activeView === 'settings'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </button>
            </div>
        </aside>
    );
};

// ✨ NEW: Header component with Profile Dropdown
const Header = ({ user, userRole, onLogout, setActiveView }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);


    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8">
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
                >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="text-gray-500" />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-sm text-gray-800">{user.displayName || user.email}</p>
                        <p className="text-xs text-gray-500">{userRole || 'User'}</p>
                    </div>
                    <ChevronDown size={16} className="text-gray-500" />
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 animate-fade-in-down">
                        <div className="px-4 py-2 border-b">
                            <p className="font-semibold text-sm text-gray-800">{user.displayName || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <button onClick={() => { setActiveView('settings'); setDropdownOpen(false); }} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <Settings size={16} />
                            <span>Settings</span>
                        </button>
                         <button className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <Globe size={16} />
                            <span>Language</span>
                        </button>
                        <div className="border-t my-1"></div>
                        <button onClick={onLogout} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};


const Layout = ({ children, user, userRole, activeView, setActiveView, onLogout }) => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col">
                <Header user={user} userRole={userRole} onLogout={onLogout} setActiveView={setActiveView} />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
