// --- src/components/SettingsView.js ---
// Replace the entire contents of your SettingsView.js file with this code.

import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const SettingsView = ({ user }) => {
    // Use the theme context to get the current setting and the function to change it
    const { themeSetting, setThemeSetting } = useContext(ThemeContext);

    const handleThemeChange = (e) => {
        setThemeSetting(e.target.value);
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage your account and application settings.
                    </p>
                </header>

                <div className="space-y-10">
                    {/* --- Appearance Settings Section --- */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Appearance</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Customize the look and feel of the application.</p>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="theme-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Theme
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">'Auto' will sync with your system's theme.</p>
                            </div>
                            
                            {/* --- THEME DROPDOWN SELECTOR --- */}
                            <select 
                                id="theme-select"
                                value={themeSetting} 
                                onChange={handleThemeChange}
                                className="mt-1 block w-auto pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                            >
                                <option value="auto">Auto</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                    </div>

                    {/* --- Account Settings Section (Placeholder) --- */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                         <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">Account</h3>
                         <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Update your user profile and manage your subscription.</p>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</span>
                            </div>
                             <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscription</span>
                                <button disabled className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700/50 px-3 py-1 rounded-full cursor-not-allowed">Manage (Coming Soon)</button>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;