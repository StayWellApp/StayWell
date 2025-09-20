// src/components/Layout.js

import React, { useState, Fragment } from 'react';
import { useAuth } from './Auth';
import { useTranslation } from 'react-i18next';
import { Menu, Transition } from '@headlessui/react';
import {
    LayoutDashboard, Users, Building, MessageSquare, BookCheck, Archive, Calendar, Settings,
    FileText, LifeBuoy, ShieldCheck, LogOut, ChevronDown, Menu as MenuIcon, Bell, Sun, Moon, Globe, Search, ChevronsLeft, ChevronsRight, X
} from 'lucide-react';

const NavLink = ({ active, onClick, icon: Icon, children, isCollapsed }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors duration-150 rounded-md ${
            active
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
        } ${isCollapsed ? 'justify-center' : ''}`}
    >
        <Icon className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
        {!isCollapsed && <span className="truncate">{children}</span>}
    </button>
);

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const toggleTheme = () => {
        setIsDark(prev => {
            const newIsDark = !prev;
            document.documentElement.classList.toggle('dark', newIsDark);
            return newIsDark;
        });
    };
    return (
        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    );
};


const Layout = ({ user, userData, activeView, setActiveView, hasPermission, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchActive, setSearchActive] = useState(false); // State for search bar visibility
    const { logout } = useAuth();
    const { t, i18n } = useTranslation();
    const { isSuperAdmin } = userData;

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const handleLogout = async () => {
        try { await logout(); } 
        catch (error) { console.error('Failed to log out:', error); }
    };

    const userNavItems = [
        { view: 'dashboard', label: t('Dashboard'), icon: LayoutDashboard, permission: true },
        { view: 'properties', label: t('Properties'), icon: Building, permission: hasPermission('properties_view_all') },
        { view: 'chat', label: t('Chat'), icon: MessageSquare, permission: true },
        { view: 'team', label: t('Team'), icon: Users, permission: hasPermission('team_manage') },
        { view: 'templates', label: t('Templates'), icon: BookCheck, permission: hasPermission('templates_manage') },
        { view: 'storage', label: t('Storage'), icon: Archive, permission: hasPermission('storage_view') },
        { view: 'calendar', label: t('Calendar'), icon: Calendar, permission: hasPermission('tasks_view_all') },
    ];

    const adminNavItems = [
        { view: 'adminDashboard', label: t('Dashboard'), icon: LayoutDashboard },
        { view: 'adminClients', label: t('Clients'), icon: Users },
        { view: 'adminSubscriptions', label: t('Subscriptions'), icon: LifeBuoy },
        { view: 'adminBilling', label: t('Billing'), icon: FileText },
        { view: 'adminAuditLog', label: t('Audit Log'), icon: ShieldCheck },
    ];
    
    const settingsItem = { view: 'settings', label: t('Settings'), icon: Settings, permission: hasPermission('team_manage') };
    const adminSettingsItem = { view: 'adminSettings', label: t('Settings'), icon: Settings };
    const finalSettingsItem = isSuperAdmin ? adminSettingsItem : settingsItem;

    const navItems = isSuperAdmin ? adminNavItems : userNavItems.filter(item => item.permission);
    const currentViewLabel = [...navItems, finalSettingsItem].find(item => item.view === activeView)?.label || t('Dashboard');

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className={`h-16 flex items-center justify-between px-4 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                {!isCollapsed && <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">StayWell</h1>}
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hidden lg:block">
                    {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.view}
                        active={activeView === item.view}
                        onClick={() => {
                            setActiveView(item.view);
                            setSidebarOpen(false);
                        }}
                        icon={item.icon}
                        isCollapsed={isCollapsed}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </div>
    );

    return (
        <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
            {/* Mobile Sidebar */}
            <Transition.Root show={sidebarOpen} as={Fragment}>
                 <div className="fixed inset-0 flex z-40 lg:hidden">
                    <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                    </Transition.Child>
                    <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800">
                            {React.cloneElement(sidebarContent, { isCollapsed: false })}
                        </div>
                    </Transition.Child>
                </div>
            </Transition.Root>

            {/* Desktop Sidebar */}
            <div className={`hidden lg:flex lg:flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
                {sidebarContent}
            </div>

            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                {/* Top Bar */}
                <div className="relative z-10 flex-shrink-0 flex h-16 shadow-sm bg-gradient-to-r from-indigo-200 via-sky-200 to-purple-200 dark:from-gray-800 dark:via-indigo-900 dark:to-purple-900 animate-gradient-x">
                    <button className="px-4 text-gray-500 dark:text-gray-300 lg:hidden" onClick={() => setSidebarOpen(true)}>
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <div className="flex-1 px-4 flex justify-between items-center">
                        <div className="flex-1 flex">
                            {/* Title takes up space, search input overlays it */}
                            <h1 className={`text-xl font-semibold text-gray-900 dark:text-gray-100 transition-opacity duration-300 ${searchActive ? 'opacity-0' : 'opacity-100'}`}>
                                {currentViewLabel}
                            </h1>
                        </div>
                        <div className="ml-4 flex items-center md:ml-6 space-x-4">
                            {/* Search Component */}
                            <div className="relative">
                                <Transition
                                    show={searchActive}
                                    as={Fragment}
                                    enter="transition-all ease-out duration-300"
                                    enterFrom="w-0 opacity-0"
                                    enterTo="w-64 opacity-100"
                                    leave="transition-all ease-in duration-200"
                                    leaveFrom="w-64 opacity-100"
                                    leaveTo="w-0 opacity-0"
                                >
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                         <input
                                            type="search"
                                            placeholder={t('Search...')}
                                            className="pl-4 pr-10 py-2 w-64 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button onClick={() => setSearchActive(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <X className="h-5 w-5"/>
                                        </button>
                                    </div>
                                </Transition>
                                <button onClick={() => setSearchActive(true)} className={`p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-opacity ${searchActive ? 'opacity-0' : 'opacity-100'}`}>
                                    <Search className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <ThemeToggle />
                            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
                                <Bell className="h-5 w-5" />
                            </button>
                            
                            {/* User Dropdown */}
                            <Menu as="div" className="relative">
                                <div><Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"><div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">{user.email ? user.email.charAt(0).toUpperCase() : '?'}</div></Menu.Button></div>
                                <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{userData.displayName || user.email}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{isSuperAdmin ? 'Super Admin' : (userData.roles ? userData.roles[0] : 'User')}</p>
                                        </div>
                                        { (finalSettingsItem.permission === undefined || finalSettingsItem.permission) &&
                                            <Menu.Item>{({ active }) => (<button onClick={() => setActiveView(finalSettingsItem.view)} className={`${active ? 'bg-gray-100 dark:bg-gray-600' : ''} w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}><Settings className="h-5 w-5 mr-3" />{t('Settings')}</button>)}</Menu.Item>
                                        }
                                        {/* Language Submenu */}
                                        <Menu as="div" className="relative w-full">
                                          {({ open }) => (
                                            <>
                                              <Menu.Button className={`w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 ${open ? 'bg-gray-100 dark:bg-gray-600' : ''}`}><Globe className="h-5 w-5 mr-3" />{t('Language')}<ChevronDown className="h-4 w-4 ml-auto" /></Menu.Button>
                                              <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="opacity-0" enterTo="opacity-100" leave="transition ease-in duration-75" leaveFrom="opacity-100" leaveTo="opacity-0">
                                                {/* Use static to prevent the parent from closing */}
                                                <Menu.Items static className="absolute -top-1/2 right-full mr-1 w-32 rounded-md shadow-lg py-1 bg-white dark:bg-gray-600 ring-1 ring-black ring-opacity-5">
                                                    <Menu.Item>{({ active }) => (<button onClick={() => changeLanguage('en')} className={`${active ? 'bg-gray-100 dark:bg-gray-500' : ''} w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}>English</button>)}</Menu.Item>
                                                    <Menu.Item>{({ active }) => (<button onClick={() => changeLanguage('es')} className={`${active ? 'bg-gray-100 dark:bg-gray-500' : ''} w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}>Español</button>)}</Menu.Item>
                                                </Menu.Items>
                                              </Transition>
                                            </>
                                          )}
                                        </Menu>
                                        <Menu.Item>{({ active }) => (<button onClick={handleLogout} className={`${active ? 'bg-gray-100 dark:bg-gray-600' : ''} w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}><LogOut className="h-5 w-5 mr-3" />{t('Logout')}</button>)}</Menu.Item>
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