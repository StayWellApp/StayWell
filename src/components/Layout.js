import React, { useContext } from 'react';
import { auth } from '../firebase-config';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Building, ListChecks, Calendar, Users, Archive, Settings, LogOut, Sun, Moon } from 'lucide-react';
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

const UserProfile = ({ user, userData }) => (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{user.displayName || user.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{userData?.role}</p>
            </div>
        </div>
    </div>
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
    if (hasPermission('team_manage')) { // Typically only admins can change settings
        navLinks.push({ id: 'settings', label: 'Settings', icon: Settings });
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="h-20 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">StayWell</h1>
                </div>
                <nav className="flex-grow p-4">
                    <ul>
                        {navLinks.map(link => (
                            <NavItem key={link.id} {...link} activeView={activeView} setActiveView={setActiveView} />
                        ))}
                    </ul>
                </nav>
                <div className="p-4">
                    <button onClick={toggleTheme} className="w-full flex items-center p-3 my-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                        {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                        <span className="ml-4 font-semibold">Toggle Theme</span>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center p-3 my-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <LogOut size={20} />
                        <span className="ml-4 font-semibold">Logout</span>
                    </button>
                </div>
                <UserProfile user={user} userData={userData} />
            </aside>
            <main className="flex-grow overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;