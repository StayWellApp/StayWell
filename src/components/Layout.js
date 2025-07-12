import React, { useContext } from 'react';
import { auth } from '../firebase-config';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Building, ListChecks, Calendar, Users, Archive, Settings, LogOut, Sun, Moon, MessageSquare, Bell, ChevronDown } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';

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

const Header = ({ user, userData, toggleTheme, theme, handleLogout }) => (
    <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
            <div>
                {/* Future search bar can go here */}
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                    {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                </button>
                <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Bell size={20} />
                </button>
                <div className="relative">
                    <button className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <ChevronDown size={16} />
                    </button>
                    {/* Dropdown for user settings, language, etc. can be implemented here */}
                </div>
                <button onClick={handleLogout} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:underline">Logout</button>
            </div>
        </div>
    </header>
);


const Layout = ({ children, user, userData, activeView, setActiveView, hasPermission }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    const handleLogout = async () => {
        await signOut(auth);
    };
    
    // --- Build navigation links based on permissions ---
    const navLinks = [];
    navLinks.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
    navLinks.push({ id: 'properties', label: 'Properties', icon: Building });

    if (hasPermission('templates_manage')) {
        navLinks.push({ id: 'templates', label: 'Templates', icon: ListChecks });
    }
    if (hasPermission('tasks_view_all')) {
        navLinks.push({ id: 'calendar', label: 'Master Calendar', icon: Calendar });
    }
    if (hasPermission('team_manage')) {
        navLinks.push({ id: 'team', label: 'Team', icon: Users });
    }
    if (hasPermission('storage_view')) {
         navLinks.push({ id: 'storage', label: 'Storage', icon: Archive });
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="h-20 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
                    {/* Better Logo */}
                    <div className="flex items-center">
                        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 ml-2">StayWell</h1>
                    </div>
                </div>
                <nav className="flex-grow p-4">
                    <ul>
                        {navLinks.map(link => (
                            <NavItem key={link.id} {...link} activeView={activeView} setActiveView={setActiveView} />
                        ))}
                    </ul>
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    {hasPermission('team_manage') && (
                        <NavItem id='settings' label='Settings' icon={Settings} activeView={activeView} setActiveView={setActiveView} />
                    )}
                </div>
            </aside>
            <div className="flex flex-col flex-grow">
                <Header user={user} userData={userData} toggleTheme={toggleTheme} theme={theme} handleLogout={handleLogout} />
                <main className="flex-grow overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;