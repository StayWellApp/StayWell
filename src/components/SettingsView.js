// --- src/components/SettingsView.js ---
// Replace the entire contents of your SettingsView.js file with this code.

import React, { useState } from 'react';
import { User, Palette, ShieldCheck, CreditCard, Bell, Globe } from 'lucide-react';

const SettingsView = ({ user }) => {
    const [activeTab, setActiveTab] = useState('profile');

    const SettingsCard = ({ children }) => (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            {children}
        </div>
    );

    const ProfileSettings = () => {
        const [displayName, setDisplayName] = useState(user.displayName || '');
        
        const handleSave = () => {
            alert(`Profile updated! Name set to: ${displayName}`);
        };

        return (
            <SettingsCard>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Profile</h2>
                <p className="text-gray-500 mb-6">This information will be displayed on your profile.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input 
                            type="text" 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <p className="text-gray-800">{user.email}</p>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <button onClick={handleSave} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Save Changes</button>
                </div>
            </SettingsCard>
        );
    };

    const ThemeSettings = () => (
         <SettingsCard>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Appearance</h2>
            <p className="text-gray-500 mb-6">Customize the look and feel of the application.</p>
            <div className="flex items-center space-x-4">
                <p className="font-medium text-gray-700">Dark Mode</p>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
            <p className="text-xs text-gray-400 mt-4">Dark mode coming soon!</p>
        </SettingsCard>
    );

    // ✨ NEW: Localization Settings Component
    const LocalizationSettings = () => (
        <SettingsCard>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Localization</h2>
            <p className="text-gray-500 mb-6">Set your preferred language, currency, and time zone.</p>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>English</option>
                        <option disabled>Spanish (coming soon)</option>
                        <option disabled>French (coming soon)</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                    <select className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option> (UTC-08:00) Pacific Time</option>
                        <option> (UTC-05:00) Eastern Time</option>
                        <option> (UTC+00:00) Coordinated Universal Time</option>
                        <option> (UTC+01:00) Central European Time</option>
                    </select>
                </div>
            </div>
             <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Save Changes</button>
            </div>
        </SettingsCard>
    );

    const PlanSettings = () => {
        // ... (No changes to this component)
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'profile': return <ProfileSettings />;
            case 'theme': return <ThemeSettings />;
            case 'localization': return <LocalizationSettings />; // ✨ NEW: Add case for localization
            case 'plan': return <PlanSettings />;
            default: return <ProfileSettings />;
        }
    };

    const Tab = ({ id, label, icon }) => (
        <button onClick={() => setActiveTab(id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account, preferences, and subscription.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-12">
                <aside className="md:w-1/4">
                    <nav className="space-y-2">
                        <Tab id="profile" label="Profile" icon={<User size={20} />} />
                        <Tab id="theme" label="Appearance" icon={<Palette size={20} />} />
                        <Tab id="localization" label="Localization" icon={<Globe size={20} />} /> {/* ✨ NEW: Add Localization Tab */}
                        <Tab id="plan" label="Plan & Billing" icon={<CreditCard size={20} />} />
                        <Tab id="notifications" label="Notifications" icon={<Bell size={20} />} />
                    </nav>
                </aside>
                <main className="flex-1">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default SettingsView;
