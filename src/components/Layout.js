import React, { useContext } from 'react';
import { auth } from '../firebase-config';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Building, ListChecks, Calendar, Users, Archive, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';

// --- CORRECTED: Added 'Settings' back to the ownerLinks array ---
const ownerLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'templates', label: 'Templates', icon: ListChecks },
    { id: 'calendar', label: 'Master Calendar', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'storage', label: 'Storage', icon: Archive },
    { id: 'settings', label: 'Settings', icon: Settings },
];

const staffLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'My Properties', icon: Building },
    { id: 'calendar', label: 'My Calendar', icon: Calendar },
    { id: 'storage', label: 'Storage', icon: Archive },
];

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

const Layout = ({ children, user, userData, activeView, setActiveView }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };
    
    const hasAdminPrivileges = () => {
        if (!userData) return false;
        const isOwner = userData.uid === userData.ownerId;
        const isAdminOrManager = userData.role === 'Admin' || userData.role === 'Manager' || userData.role === 'Owner';
        return isOwner || isAdminOrManager;
    };
    
    const navLinks = hasAdminPrivileges() ? ownerLinks : staffLinks;

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