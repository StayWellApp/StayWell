import React, { useState, useContext, useEffect, useMemo } from 'react';
import { db } from '../firebase-config';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, updateDoc, deleteField } from 'firebase/firestore';
import { ThemeContext } from '../contexts/ThemeContext';
import { User, Shield, Palette, Bell, AlertCircle, Plus, Trash2, Edit, Globe, DollarSign, Clock, Languages } from 'lucide-react';
import { PERMISSION_CATEGORIES, INITIAL_PERMISSIONS_STATE, STANDARD_ROLES } from '../config/permissions';

// --- Reusable Components for the Tabbed Layout ---
const SettingsTab = ({ id, label, icon: Icon, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === id
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
    >
        <Icon size={18} className="mr-2" />
        {label}
    </button>
);

const SettingsPanel = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in-down">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">{title}</h3>
        {children}
    </div>
);

// --- Main Settings View Component ---
const SettingsView = ({ user }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [profileName, setProfileName] = useState(user.displayName || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState('');
    const { themeSetting, setThemeSetting } = useContext(ThemeContext);
    const [notifications, setNotifications] = useState({});

    // New states for Localization settings
    const [currency, setCurrency] = useState('USD');
    const [timezone, setTimezone] = useState('UTC');
    const [language, setLanguage] = useState('en');
    const [isSavingLocalization, setIsSavingLocalization] = useState(false);


    useEffect(() => {
        if (!user) return;
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        const userSettingsUnsub = onSnapshot(userSettingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const settingsData = docSnap.data();
                setNotifications(settingsData.notifications || {});
                setCurrency(settingsData.currency || 'USD'); // Fetch currency, default to USD
                setTimezone(settingsData.timezone || 'UTC'); // Fetch timezone, default to UTC
                setLanguage(settingsData.language || 'en'); // Fetch language, default to en
            } else {
                // Set default values if no settings doc exists
                setCurrency('USD');
                setTimezone('UTC');
                setLanguage('en');
            }
        });
        return () => userSettingsUnsub();
    }, [user]);

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (!profileName.trim()) {
            setProfileError('Display name cannot be empty.');
            return;
        }
        setIsSavingProfile(true);
        setProfileError('');
        try {
            await updateProfile(user, { displayName: profileName });
            await updateDoc(doc(db, 'users', user.uid), { displayName: profileName });
            alert('Profile updated successfully!');
        } catch (err) {
            setProfileError('Failed to update profile.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleNotificationChange = async (key, value) => {
        const newNotifications = { ...notifications, [key]: value };
        setNotifications(newNotifications);
        await setDoc(doc(db, 'userSettings', user.uid), { notifications: newNotifications }, { merge: true });
    };

    // New handler for Localization settings
    const handleLocalizationSave = async (e) => {
        e.preventDefault();
        setIsSavingLocalization(true);
        try {
            await updateDoc(doc(db, 'userSettings', user.uid), {
                currency: currency,
                timezone: timezone,
                language: language
            }, { merge: true });
            alert('Localization settings updated successfully!');
        } catch (err) {
            console.error("Error updating localization settings:", err);
            alert('Failed to update localization settings.');
        } finally {
            setIsSavingLocalization(false);
        }
    };

    // Options for dropdowns
    const currencyOptions = [
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
        { value: 'GBP', label: 'GBP (£)' },
        { value: 'JPY', label: 'JPY (¥)' },
        { value: 'CAD', label: 'CAD ($)' },
        { value: 'AUD', label: 'AUD ($)' },
        { value: 'CHF', label: 'CHF (CHF)' }, // Swiss Franc
        { value: 'CNY', label: 'CNY (¥)' }, // Chinese Yuan
        { value: 'SEK', label: 'SEK (kr)' }, // Swedish Krona
        { value: 'NZD', label: 'NZD ($)' }, // New Zealand Dollar
        { value: 'SGD', label: 'SGD ($)' }, // Singapore Dollar
    ];
    const timezoneOptions = [
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
        { value: 'America/New_York', label: 'Eastern Time - New York (EST/EDT)' },
        { value: 'America/Chicago', label: 'Central Time - Chicago (CST/CDT)' },
        { value: 'America/Denver', label: 'Mountain Time - Denver (MST/MDT)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time - Los Angeles (PST/PDT)' },
        { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
        { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)' },
        { value: 'Europe/London', label: 'London (GMT/BST)' },
        { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
        { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
        { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
        { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
        { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
        { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
        { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
        { value: 'Europe/Oslo', label: 'Oslo (CET/CEST)' },
        { value: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)' },
        { value: 'Europe/Warsaw', label: 'Warsaw (CET/CEST)' },
        { value: 'Europe/Prague', label: 'Prague (CET/CEST)' },
        { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
        { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
        { value: 'Asia/Dubai', label: 'Dubai (GST)' },
        { value: 'Asia/Kolkata', label: 'Kolkata (IST)' },
        { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
        { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
        { value: 'Australia/Perth', label: 'Perth (AWST)' },
        { value: 'Africa/Cairo', label: 'Cairo (EET/EEST)' },
        { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
        { value: 'America/Sao_Paulo', label: 'São Paulo (BRT/BRST)' },
        { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)' },
    ];
    const languageOptions = [
        { value: 'en', label: 'English', flagClass: 'fi fi-us' }, // Using US flag for English for now, common for 'en'
        { value: 'es', label: 'Spanish', flagClass: 'fi fi-es' },
        { value: 'fr', label: 'French', flagClass: 'fi fi-fr' },
        { value: 'de', label: 'German', flagClass: 'fi fi-de' },
        { value: 'it', label: 'Italian', flagClass: 'fi fi-it' },
        { value: 'pt', label: 'Portuguese', flagClass: 'fi fi-pt' },
        { value: 'zh', label: 'Chinese', flagClass: 'fi fi-cn' },
        { value: 'ja', label: 'Japanese', flagClass: 'fi fi-jp' },
    ];
    
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account, roles, and workspace settings.</p>
            </header>

            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4 lg:w-1/5">
                    <nav className="space-y-1">
                        <SettingsTab id="profile" label="Profile" icon={User} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SettingsTab id="roles" label="Roles & Permissions" icon={Shield} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SettingsTab id="appearance" label="Appearance" icon={Palette} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SettingsTab id="notifications" label="Notifications" icon={Bell} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SettingsTab id="localization" label="Localization" icon={Globe} activeTab={activeTab} setActiveTab={setActiveTab} /> {/* New Tab */}
                        <SettingsTab id="account" label="Account" icon={AlertCircle} activeTab={activeTab} setActiveTab={setActiveTab} />
                    </nav>
                </aside>

                <main className="flex-1">
                    {activeTab === 'profile' && (
                        <SettingsPanel title="Profile Information">
                            <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
                                {profileError && <p className="text-red-500 text-sm">{profileError}</p>}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="mt-1 input-style" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button type="submit" disabled={isSavingProfile} className="button-primary">{isSavingProfile ? 'Saving...' : 'Save Profile'}</button>
                                </div>
                            </form>
                        </SettingsPanel>
                    )}
                    {activeTab === 'roles' && <RolesPanel user={user} />}
                    {activeTab === 'appearance' && (
                        <SettingsPanel title="Appearance">
                             <div className="flex items-center justify-between max-w-lg">
                                <div>
                                    <label htmlFor="theme-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">'Auto' will sync with your system's theme.</p>
                                </div>
                                <select id="theme-select" value={themeSetting} onChange={(e) => setThemeSetting(e.target.value)} className="input-style w-auto">
                                    <option value="auto">Auto</option>
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>
                        </SettingsPanel>
                    )}
                    {activeTab === 'notifications' && (
                        <SettingsPanel title="Notification Settings">
                             <div className="space-y-3 max-w-lg">
                                <NotificationToggle id="taskUpdates" label="Task Updates" checked={!!notifications.taskUpdates} onChange={(e) => handleNotificationChange('taskUpdates', e.target.checked)} />
                                <NotificationToggle id="bookingAlerts" label="New Booking Alerts" checked={!!notifications.bookingAlerts} onChange={(e) => handleNotificationChange('bookingAlerts', e.target.checked)} />
                             </div>
                        </SettingsPanel>
                    )}
                    {activeTab === 'localization' && ( // New Localization Panel
                        <SettingsPanel title="Localization Settings">
                            <form onSubmit={handleLocalizationSave} className="space-y-4 max-w-lg">
                                <div>
                                    <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                                    <select
                                        id="currency-select"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="mt-1 input-style"
                                    >
                                        {currencyOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="timezone-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
                                    <select
                                        id="timezone-select"
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="mt-1 input-style"
                                    >
                                        {timezoneOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                                    <select
                                        id="language-select"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="mt-1 input-style"
                                    >
                                        {languageOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {/* Note: Native <select> options cannot render complex HTML like <span> for flags. */}
                                                {/* These classes are prepared here for use with a custom dropdown component if implemented. */}
                                                {/* For native select, only the text label will be visible. */}
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button type="submit" disabled={isSavingLocalization} className="button-primary">{isSavingLocalization ? 'Saving...' : 'Save Localization'}</button>
                                </div>
                            </form>
                        </SettingsPanel>
                    )}
                    {activeTab === 'account' && (
                        <SettingsPanel title="Account Actions">
                             <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg max-w-lg">
                                  <div>
                                      <h4 className="font-semibold text-red-800 dark:text-red-300">Delete Account</h4>
                                      <p className="text-sm text-red-600 dark:text-red-400">Permanently remove all your data.</p>
                                  </div>
                                  <button disabled className="button-danger disabled:bg-red-300 dark:disabled:bg-red-800 disabled:cursor-not-allowed"><Trash2 size={16} className="mr-2" /> Delete</button>
                              </div>
                        </SettingsPanel>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- Roles & Permissions Panel Component ---
const RolesPanel = ({ user }) => {
    const [customRoles, setCustomRoles] = useState([]);
    const [standardRolePermissions, setStandardRolePermissions] = useState({}); // State for customized standard role permissions
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    // Fetch custom roles
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "customRoles"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCustomRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // Fetch standard role permissions from userSettings
    useEffect(() => {
        if (!user) return;
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        const unsubscribe = onSnapshot(userSettingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setStandardRolePermissions(docSnap.data().standardRolePermissions || {});
            } else {
                setStandardRolePermissions({});
            }
        });
        return () => unsubscribe();
    }, [user]);


    // Combine STANDARD_ROLES with custom roles and their respective permissions
    const allDisplayRoles = useMemo(() => {
        const combinedRoles = {};

        // Add standard roles first, merging with custom permissions if they exist
        STANDARD_ROLES.forEach(standardRole => {
            const currentPermissions = {
                ...standardRole.defaultPermissions,
                ...(standardRolePermissions[standardRole.id] || {}) // Apply owner-specific overrides
            };
            combinedRoles[standardRole.id] = {
                ...standardRole,
                type: 'standard', // Mark as standard role
                permissions: currentPermissions,
            };
        });

        // Add custom roles, explicitly setting isDeletable: true
        customRoles.forEach(customRole => {
            combinedRoles[customRole.id] = {
                ...customRole,
                id: customRole.id, // Ensure ID is present if not destructured
                label: customRole.roleName, // Custom roles use roleName as label
                type: 'custom', // Mark as custom role
                isDeletable: true, // Explicitly set to true for custom roles
            };
        });

        // Convert to array and sort: Owner first, then alphabetically by label
        const sortedRoles = Object.values(combinedRoles).sort((a, b) => {
            if (a.id === 'Owner') return -1;
            if (b.id === 'Owner') return 1;
            return a.label.localeCompare(b.label);
        });

        return sortedRoles;
    }, [customRoles, standardRolePermissions]); // Dependencies for useMemo

    const handleOpenModal = (role = null) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };

    const handleSaveRole = async (roleData) => {
        // Normalize roleName to an empty string if it's undefined or null
        const normalizedRoleName = roleData.roleName || '';
        // Determine if it's a new custom role (no id, and explicitly type === 'custom' due to RoleFormModal changes)
        const isNewCustomRole = !roleData.id && roleData.type === 'custom';

        console.log("handleSaveRole - Received roleData:", roleData); // DIAGNOSTIC LOG
        console.log("handleSaveRole - Normalized Role Name:", normalizedRoleName, "trimmed:", normalizedRoleName.trim()); // DIAGNOSTIC LOG
        console.log("handleSaveRole - isNewCustomRole:", isNewCustomRole); // DIAGNOSTIC LOG

        // Check if role name is empty for custom roles (new or existing)
        if ((roleData.type === 'custom' || isNewCustomRole) && !normalizedRoleName.trim()) {
            console.log("handleSaveRole - Validation failed: role name is empty or only whitespace."); // DIAGNOSTIC LOG
            alert('Role name cannot be empty for custom roles.');
            return;
        }

        try {
            if (isNewCustomRole) {
                // Create new custom role
                await addDoc(collection(db, "customRoles"), {
                    roleName: normalizedRoleName, // Use normalized value
                    permissions: roleData.permissions,
                    ownerId: user.uid,
                    createdAt: serverTimestamp()
                });
            } else if (roleData.type === 'custom') {
                // Update existing custom role
                await updateDoc(doc(db, "customRoles", roleData.id), { // Use roleData.id
                    roleName: normalizedRoleName, // Use normalized value
                    permissions: roleData.permissions,
                    updatedAt: serverTimestamp()
                });
            } else if (roleData.type === 'standard') {
                // Update permissions for a standard role within owner's userSettings
                const userSettingsRef = doc(db, 'userSettings', user.uid);
                await updateDoc(userSettingsRef, {
                    [`standardRolePermissions.${roleData.id}`]: roleData.permissions
                }, { merge: true });
            }
            alert('Role saved successfully!');
            handleCloseModal();
        } catch (error) {
            console.error("Error saving role:", error);
            alert('Failed to save role.');
        }
    };

    const handleDeleteRole = async (roleId, roleType) => {
        if (roleType === 'standard') {
            // Confirm the reset action
            if (window.confirm(`Are you sure you want to reset permissions for this built-in role to its default? This cannot be undone.`)) {
                try {
                    const userSettingsRef = doc(db, 'userSettings', user.uid);
                    await updateDoc(userSettingsRef, {
                        [`standardRolePermissions.${roleId}`]: deleteField() // Use deleteField to remove the specific customization
                    });
                    alert('Built-in role permissions reset to default.');
                } catch (error) {
                    console.error("Error resetting standard role permissions:", error);
                    alert('Failed to reset built-in role permissions.');
                }
            }
            return;
        }
        if (window.confirm("Are you sure you want to delete this custom role?")) { // Clarify for custom roles
            try {
                await deleteDoc(doc(db, "customRoles", roleId));
                alert("Custom role deleted successfully.");
            } catch (error) {
                console.error("Error deleting custom role:", error);
                alert('Failed to delete custom role.');
            }
        }
    };

    return (
        <SettingsPanel title="Roles & Permissions">
             <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Define custom roles for your team members. Standard roles are built-in.</p>
                <button onClick={() => handleOpenModal()} className="button-primary"><Plus size={16} className="mr-2" /> Create Role</button>
            </div>
             <div className="border-t border-gray-200 dark:border-gray-700">
                {loading && (customRoles.length === 0 && STANDARD_ROLES.length === 0) ? ( // Check if both are empty
                    <p className="text-center py-4">Loading roles...</p>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {allDisplayRoles.map(role => (
                            <li key={role.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <span className="text-gray-800 dark:text-gray-200 font-medium">{role.label}</span>
                                    {role.type === 'standard' && (
                                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Built-in</span>
                                    )}
                                </div>
                                <div className="flex items-center space-x-4">
                                    <button onClick={() => handleOpenModal(role)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Edit Permissions">
                                        <Edit size={16} />
                                    </button>
                                    {role.isDeletable && ( // Only show delete for deletable roles (custom roles)
                                        <button onClick={() => handleDeleteRole(role.id, role.type)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete Role">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                        {allDisplayRoles.length === 0 && !loading && <p className="text-center text-gray-400 py-6">No roles defined yet.</p>}
                    </ul>
                )}
            </div>
            {isModalOpen && <RoleFormModal onSave={handleSaveRole} onCancel={handleCloseModal} existingRole={editingRole} />}
        </SettingsPanel>
    );
};

// --- CORRECTED: Role Creation/Edit Modal Component ---
const RoleFormModal = ({ onSave, onCancel, existingRole = null }) => {
    // For existing standard roles, roleName is fixed. For new/custom, it's editable.
    // Simplified initialization to ensure roleName is always a string
    const [roleName, setRoleName] = useState(
        existingRole ? (existingRole.type === 'custom' ? existingRole.roleName : existingRole.label) : ''
    );
    const [permissions, setPermissions] = useState(existingRole?.permissions || INITIAL_PERMISSIONS_STATE); // Use INITIAL_PERMISSIONS_STATE as default

    useEffect(() => {
        if (existingRole) {
            // Merge existing permissions with initial state to ensure all checkboxes are displayed
            const mergedPermissions = {
                ...INITIAL_PERMISSIONS_STATE,
                ...existingRole.permissions
            };
            setPermissions(mergedPermissions);
        } else {
            setPermissions(INITIAL_PERMISSIONS_STATE);
        }
    }, [existingRole]);

    const handlePermissionChange = (permissionId) => {
        setPermissions(prev => ({ ...prev, [permissionId]: !prev[permissionId] }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const rolePayload = {
            ...existingRole, // Preserve existing role properties like id
            roleName: String(roleName), // Ensure roleName is always a string before passing
            permissions: permissions
        };

        // Explicitly set type to 'custom' if it's a new role being created
        if (!existingRole) {
            rolePayload.type = 'custom';
        }
        console.log("RoleFormModal - Submitting rolePayload:", rolePayload); // DIAGNOSTIC LOG
        onSave(rolePayload);
    };
    
    return (
        <div className="fixed inset-0 grid place-items-center bg-black bg-opacity-50 z-50"> 
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl border dark:border-gray-700 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {existingRole ? (existingRole.type === 'custom' ? 'Edit Custom Role' : 'Edit Built-in Role Permissions') : 'Create New Custom Role'}
                    </h3>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                    {/* Scrollable Content */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-grow">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role Name</label>
                            <input
                                type="text"
                                value={roleName}
                                onChange={e => setRoleName(e.target.value)}
                                placeholder="e.g., Property Manager"
                                className="mt-1 input-style"
                                required={existingRole?.type !== 'standard'} // Required only for custom roles
                                disabled={existingRole?.type === 'standard'} // Disable for standard roles
                            />
                            {existingRole?.type === 'standard' && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Role name is fixed for built-in roles.</p>
                            )}
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Permissions</h4>
                            {PERMISSION_CATEGORIES.map(category => (
                                <div key={category.id}>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mt-4">{category.label}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{category.description}</p>
                                    <div className="space-y-2 pl-2 border-l-2 dark:border-gray-600">
                                        {category.permissions.map(perm => (
                                            <label key={perm.id} className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!permissions[perm.id]}
                                                    onChange={() => handlePermissionChange(perm.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    disabled={existingRole?.id === 'Owner' && permissions[perm.id] === true} // Owner's true permissions are not editable
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end space-x-2 flex-shrink-0">
                        <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                        <button type="submit" className="button-primary">Save Role</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Reusable Notification Toggle Component ---
const NotificationToggle = ({ id, label, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id={id} checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
        </label>
    </div>
);

export default SettingsView;