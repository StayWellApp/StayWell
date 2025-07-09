import React, { useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ThemeContext } from '../contexts/ThemeContext';
import { User, Bell, Palette, Trash2, AlertCircle, Shield, Plus } from 'lucide-react';

const SettingsView = ({ user }) => {
    // --- EXISTING STATE ---
    const { themeSetting, setThemeSetting } = useContext(ThemeContext);
    const [profileName, setProfileName] = useState(user.displayName || '');
    const [notifications, setNotifications] = useState({
        taskUpdates: true,
        bookingAlerts: false,
        monthlyReports: true,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // --- NEW STATE FOR ROLE MANAGEMENT ---
    const [roles, setRoles] = useState([]);
    const [newRoleName, setNewRoleName] = useState('');
    const [rolesLoading, setRolesLoading] = useState(true);

    // --- EXISTING DATA FETCHING ---
    useEffect(() => {
        if (!user) return;
        
        // Fetch user-specific settings (notifications, etc.)
        const fetchUserSettings = async () => {
            const userSettingsRef = doc(db, 'userSettings', user.uid);
            const docSnap = await getDoc(userSettingsRef);
            if (docSnap.exists()) {
                const settings = docSnap.data();
                setNotifications(settings.notifications || { taskUpdates: true, bookingAlerts: false, monthlyReports: true });
            }
        };
        fetchUserSettings();

        // --- NEW: Fetch custom roles ---
        const rolesQuery = query(collection(db, "customRoles"), where("ownerId", "==", user.uid));
        const unsubscribeRoles = onSnapshot(rolesQuery, (snapshot) => {
            const rolesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoles(rolesList);
            setRolesLoading(false);
        });

        return () => {
            unsubscribeRoles();
        };

    }, [user]);

    // --- EXISTING EVENT HANDLERS ---
    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (profileName.trim() === '') {
            setError('Display name cannot be empty.');
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            await updateProfile(auth.currentUser, { displayName: profileName });
        } catch (err) {
            setError('Failed to update profile. Please try again.');
            console.error(err);
        } finally {
            setIsSaving(false);
            alert('Profile updated successfully!');
        }
    };

    const handleNotificationChange = async (key) => {
        const newSettings = { ...notifications, [key]: !notifications[key] };
        setNotifications(newSettings);
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        await setDoc(userSettingsRef, { notifications: newSettings }, { merge: true });
    };

    const handleThemeChange = (e) => {
        setThemeSetting(e.target.value);
    };

    // --- NEW EVENT HANDLERS FOR ROLE MANAGEMENT ---
    const handleAddRole = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        try {
            await addDoc(collection(db, "customRoles"), {
                roleName: newRoleName.trim(),
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });
            setNewRoleName('');
        } catch (error) {
            console.error("Error adding role:", error);
            alert("Failed to add new role.");
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (window.confirm("Are you sure you want to delete this role?")) {
            await deleteDoc(doc(db, "customRoles", roleId));
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage your profile, roles, appearance, and notification settings.
                    </p>
                </header>

                <div className="space-y-10">
                    {/* --- Profile Settings Section (No changes) --- */}
                    <SettingsCard icon={<User />} title="Profile" description="Update your personal information.">
                        <form onSubmit={handleProfileSave} className="space-y-4">
                            {error && (
                                <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-300 text-sm font-medium p-3 rounded-lg">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="mt-1 input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={isSaving} className="button-primary">
                                    {isSaving ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    </SettingsCard>
                    
                    {/* --- NEW: Roles & Permissions Card --- */}
                    <SettingsCard icon={<Shield />} title="Roles & Permissions" description="Create and manage custom roles for your team.">
                        <form onSubmit={handleAddRole} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                placeholder="e.g., Front Desk"
                                className="input-style flex-grow"
                            />
                            <button type="submit" className="button-primary h-full">
                                <Plus size={18} />
                            </button>
                        </form>
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700">
                            {rolesLoading ? <p className="text-center py-4">Loading roles...</p> : (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {roles.map(role => (
                                        <li key={role.id} className="py-3 flex justify-between items-center">
                                            <span className="text-gray-800 dark:text-gray-200">{role.roleName}</span>
                                            <button onClick={() => handleDeleteRole(role.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                                <Trash2 size={16} />
                                            </button>
                                        </li>
                                    ))}
                                    {roles.length === 0 && !rolesLoading && (
                                        <p className="text-center text-gray-400 py-6">No custom roles created yet.</p>
                                    )}
                                </ul>
                            )}
                        </div>
                    </SettingsCard>

                    {/* --- Appearance Settings Section (No changes) --- */}
                    <SettingsCard icon={<Palette />} title="Appearance" description="Customize the look and feel of the application.">
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="theme-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">'Auto' will sync with your system's theme.</p>
                            </div>
                            <select id="theme-select" value={themeSetting} onChange={handleThemeChange} className="mt-1 block w-auto pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm">
                                <option value="auto">Auto</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                    </SettingsCard>
                    
                    {/* --- Notifications Section (No changes) --- */}
                    <SettingsCard icon={<Bell />} title="Notifications" description="Choose how you want to be notified.">
                          <div className="space-y-3">
                              {Object.keys(notifications).map((key) => (
                                  <div key={key} className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                          <input type="checkbox" checked={notifications[key]} onChange={() => handleNotificationChange(key)} className="sr-only peer" />
                                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
                                      </label>
                                  </div>
                              ))}
                          </div>
                    </SettingsCard>

                    {/* --- Account Actions Section (No changes) --- */}
                    <SettingsCard icon={<AlertCircle />} title="Account Actions" description="Manage your account status.">
                          <div className="space-y-4">
                              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg">
                                  <div>
                                      <h4 className="font-semibold text-red-800 dark:text-red-300">Delete Account</h4>
                                      <p className="text-sm text-red-600 dark:text-red-400">Permanently remove all your data. This action is irreversible.</p>
                                  </div>
                                  <button disabled className="button-danger disabled:bg-red-300 dark:disabled:bg-red-800 disabled:cursor-not-allowed">
                                      <Trash2 size={16} className="mr-2" /> Delete
                                  </button>
                              </div>
                          </div>
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
};

const SettingsCard = ({ icon, title, description, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-lg p-2">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

export default SettingsView;