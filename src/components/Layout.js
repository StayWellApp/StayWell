import React, { useState, useContext, useRef, useEffect } from 'react';
import { auth } from '../firebase-config';
import { signOut } from 'firebase/auth';
import {
    LayoutDashboard, Building, ListChecks, Calendar, Users, Archive, Settings,
    LogOut, Sun, Moon, Bell, ChevronDown, Check, MessageSquare, SlidersHorizontal, FileClock, DollarSign
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';

// Helper hook to detect clicks outside a component
const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

// --- Header Component (No changes needed here) ---
const Header = ({ user, toggleTheme, theme, handleLogout, setActiveView }) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
    const languages = {
        'gb': { flag: 'gb', name: 'English' },
        'es': { flag: 'es', name: 'Español' },
        'fr': { flag: 'fr', name: 'Français' },
    };
    const [currentLanguage, setCurrentLanguage] = useState(languages['gb']);
    const userMenuRef = useRef(null);
    const notificationsRef = useRef(null);
    const languageMenuRef = useRef(null);
    useClickOutside(userMenuRef, () => setUserMenuOpen(false));
    useClickOutside(notificationsRef, () => setNotificationsOpen(false));
    useClickOutside(languageMenuRef, () => setLanguageMenuOpen(false));

    return (
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 h-20">
                <div></div>
                <div className="flex items-center space-x-4">
                    <div className="relative" ref={languageMenuRef}>
                        <button onClick={() => setLanguageMenuOpen(!languageMenuOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label="Select language">
                            <span className={`fi fi-${currentLanguage.flag} rounded-full`}></span>
                        </button>
                        {languageMenuOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-10">
                                {Object.values(languages).map((lang) => (
                                    <button key={lang.flag} onClick={() => { setCurrentLanguage(lang); setLanguageMenuOpen(false); }} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <span className={`fi fi-${lang.flag} mr-3`}></span>
                                        <span>{lang.name}</span>
                                        {currentLanguage.flag === lang.flag && <Check size={16} className="ml-auto text-blue-500" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label="Toggle theme">
                        {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                    <div className="relative" ref={notificationsRef}>
                         <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label="Notifications">
                            <Bell size={20} />
                        </button>
                        {notificationsOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
                                <div className="p-4 font-semibold border-b dark:border-gray-700">Notifications</div>
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">No new notifications</div>
                            </div>
                        )}
                    </div>
                    <div className="relative" ref={userMenuRef}>
                        <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                             <img className="w-8 h-8 rounded-full" src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`} alt="User avatar" />
                            <span className="hidden sm:inline text-sm font-semibold text-gray-700 dark:text-gray-300">{user.displayName || user.email}</span>
                            <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
                        </button>
                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-10">
                                <div className="px-4 py-2 border-b dark:border-gray-700">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Signed in as</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                                </div>
                                <button onClick={() => { setActiveView('settings'); setUserMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <Settings size={16} className="mr-2"/> Settings
                                </button>
                                <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <LogOut size={16} className="mr-2"/> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};


// --- NavItem Component ---
const NavItem = ({ id, label, icon: Icon, activeView, setActiveView }) => (
    <li>
        <button
            onClick={() => setActiveView(id)}
            className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors ${
                activeView === id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            <Icon size={20} />
            <span className="ml-4 font-semibold">{label}</span>
        </button>
    </li>
);

// --- Main Layout Component ---
const Layout = ({ children, user, userData, activeView, setActiveView, hasPermission }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const isSuperAdmin = userData?.isSuperAdmin;

    const handleLogout = async () => {
        await signOut(auth);
    };
    
    // Define navigation links based on user type
    const userNavLinks = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'properties', label: 'Properties', icon: Building },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        ...(hasPermission('templates_manage') ? [{ id: 'templates', label: 'Templates', icon: ListChecks }] : []),
        ...(hasPermission('tasks_view_all') ? [{ id: 'calendar', label: 'Master Calendar', icon: Calendar }] : []),
        ...(hasPermission('team_manage') ? [{ id: 'team', label: 'Team', icon: Users }] : []),
        ...(hasPermission('storage_view') ? [{ id: 'storage', label: 'Storage', icon: Archive }] : []),
    ];

    const adminNavLinks = [
        { id: 'adminDashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'adminClients', label: 'Clients', icon: Users },
        { id: 'adminBilling', label: 'Billing', icon: DollarSign },
        { id: 'adminSettings', label: 'Settings', icon: SlidersHorizontal },
        { id: 'adminAuditLog', label: 'Audit Log', icon: FileClock },
    ];

    const navLinks = isSuperAdmin ? adminNavLinks : userNavLinks;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="h-20 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 px-4">
                    {isSuperAdmin ? (
                         <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
                    ) : (
                        <div className="flex items-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 ml-2">StayWell</h1>
                        </div>
                    )}
                </div>
                <nav className="flex-grow p-4">
                    <ul>
                        {navLinks.map(link => (
                            <NavItem key={link.id} {...link} activeView={activeView} setActiveView={setActiveView} />
                        ))}
                    </ul>
                </nav>
            </aside>
            <div className="flex flex-col flex-grow">
                <Header 
                    user={user} 
                    theme={theme} 
                    toggleTheme={toggleTheme} 
                    handleLogout={handleLogout}
                    setActiveView={setActiveView} 
                />
                <main className={`flex-grow overflow-y-auto ${activeView === 'chat' ? 'p-0' : 'p-8'}`}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;