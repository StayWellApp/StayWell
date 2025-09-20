// src/components/Layout.js

import React, { useState, Fragment } from 'react';
import { useAuth } from './Auth';
import { Menu, Transition } from '@headlessui/react';
import {
    LayoutDashboard, Users, Building, MessageSquare, BookCheck, Archive, Calendar, Settings,
    BarChart2, FileText, LifeBuoy, ShieldCheck, LogOut, ChevronDown, Menu as MenuIcon, X
} from 'lucide-react';

const NavLink = ({ active, onClick, icon: Icon, children }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors duration-150 ${
            active
                ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-gray-100'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
        }`}
    >
        <Icon className={`h-5 w-5 mr-3 ${active ? 'text-indigo-500' : ''}`} />
        <span className="truncate">{children}</span>
    </button>
);

const Layout = ({ user, userData, activeView, setActiveView, hasPermission, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { logout } = useAuth();
    const { isSuperAdmin } = userData;

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    const userNavItems = [
        { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: true },
        { view: 'properties', label: 'Properties', icon: Building, permission: hasPermission('properties_view_all') },
        { view: 'chat', label: 'Chat', icon: MessageSquare, permission: true },
        { view: 'team', label: 'Team', icon: Users, permission: hasPermission('team_manage') },
        { view: 'templates', label: 'Templates', icon: BookCheck, permission: hasPermission('templates_manage') },
        { view: 'storage', label: 'Storage', icon: Archive, permission: hasPermission('storage_view') },
        { view: 'calendar', label: 'Calendar', icon: Calendar, permission: hasPermission('tasks_view_all') },
        { view: 'settings', label: 'Settings', icon: Settings, permission: hasPermission('team_manage') },
    ];

    const adminNavItems = [
        { view: 'adminDashboard', label: 'Dashboard', icon: LayoutDashboard },
        { view: 'adminClients', label: 'Clients', icon: Users },
        { view: 'adminSubscriptions', label: 'Subscriptions', icon: LifeBuoy },
        { view: 'adminBilling', label: 'Billing', icon: FileText },
        { view: 'adminAuditLog', label: 'Audit Log', icon: ShieldCheck },
        { view: 'adminSettings', label: 'Settings', icon: Settings },
    ];

    const navItems = isSuperAdmin ? adminNavItems : userNavItems.filter(item => item.permission);
    const currentViewLabel = navItems.find(item => item.view === activeView)?.label || 'Dashboard';

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">StayWell</h1>
            </div>
            <nav className="flex-1 py-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.view}
                        active={activeView === item.view}
                        onClick={() => {
                            setActiveView(item.view);
                            setSidebarOpen(false); // Close sidebar on mobile after click
                        }}
                        icon={item.icon}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
                        {user.email ? user.email.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{userData.displayName || user.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{isSuperAdmin ? 'Super Admin' : (userData.roles ? userData.roles[0] : 'User')}</p>
                    </div>
                    <button onClick={handleLogout} className="ml-auto p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
            {/* Mobile Sidebar */}
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <div className="fixed inset-0 flex z-40 lg:hidden">
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                    </Transition.Child>
                    <Transition.Child
                        as={Fragment}
                        enter="transition ease-in-out duration-300 transform"
                        enterFrom="-translate-x-full"
                        enterTo="translate-x-0"
                        leave="transition ease-in-out duration-300 transform"
                        leaveFrom="translate-x-0"
                        leaveTo="-translate-x-full"
                    >
                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
                            {sidebarContent}
                        </div>
                    </Transition.Child>
                </div>
            </Transition.Root>

            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:flex-shrink-0">
                <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    {sidebarContent}
                </div>
            </div>

            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                {/* Top Bar */}
                <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:border-none">
                    <button
                        className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <MenuIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="flex-1 px-4 flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{currentViewLabel}</h1>
                        {/* Mobile User Menu */}
                        <div className="lg:hidden">
                            <Menu as="div" className="relative">
                                <div>
                                    <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
                                            {user.email ? user.email.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    </Menu.Button>
                                </div>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{userData.displayName || user.email}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{isSuperAdmin ? 'Super Admin' : (userData.roles ? userData.roles[0] : 'User')}</p>
                                        </div>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button onClick={handleLogout} className={`${active ? 'bg-gray-100 dark:bg-gray-600' : ''} w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}>
                                                    <LogOut className="h-5 w-5 mr-3" />
                                                    Logout
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    </div>
                </div>

                <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;