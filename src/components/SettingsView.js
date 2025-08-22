import React, { useState, useContext, useEffect, useMemo } from 'react';
import { db, storage, auth } from '../firebase-config';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, updateDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { ThemeContext } from '../contexts/ThemeContext';
import { User, Shield, Palette, Bell, AlertCircle, Plus, Trash2, Edit, Globe, Upload, CreditCard } from 'lucide-react';
import { PERMISSION_CATEGORIES, INITIAL_PERMISSIONS_STATE, STANDARD_ROLES } from '../config/permissions';
import CustomSelect from './CustomSelect';
import SubscriptionPanel from './SubscriptionPanel'; // Import the new panel

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

// --- CORRECTED: Role Creation/Edit Modal Component ---
const RoleFormModal = ({ onSave, onCancel, existingRole = null }) => {
    const [roleName, setRoleName] = useState(
        existingRole ? (existingRole.type === 'custom' ? existingRole.roleName : existingRole.label) : ''
    );
    const [permissions, setPermissions] = useState(existingRole?.permissions || INITIAL_PERMISSIONS_STATE);

    useEffect(() => {
        if (existingRole) {
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
            ...existingRole,
            roleName: String(roleName),
            permissions: permissions
        };

        if (!existingRole) {
            rolePayload.type = 'custom';
        }
        onSave(rolePayload);
    };
    
    return (
        <div className="fixed inset-0 grid place-items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl border dark:border-gray-700 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {existingRole ? (existingRole.type === 'custom' ? 'Edit Custom Role' : 'Edit Built-in Role Permissions') : 'Create New Custom Role'}
                    </h3>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                    <div className="p-6 space-y-6 overflow-y-auto flex-grow">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role Name</label>
                            <input
                                type="text"
                                value={roleName}
                                onChange={e => setRoleName(e.target.value)}
                                placeholder="e.g., Property Manager"
                                className="mt-1 input-style"
                                required={existingRole?.type !== 'standard'}
                                disabled={existingRole?.type === 'standard'}
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
                                                    disabled={existingRole?.id === 'Owner' && permissions[perm.id] === true}
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end space-x-2 flex-shrink-0">
                        <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                        <button type="submit" className="button-primary">Save Role</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Roles & Permissions Panel Component ---
const RolesPanel = ({ user }) => {
    const [customRoles, setCustomRoles] = useState([]);
    const [standardRolePermissions, setStandardRolePermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "customRoles"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCustomRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

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


    const allDisplayRoles = useMemo(() => {
        const combinedRoles = {};

        STANDARD_ROLES.forEach(standardRole => {
            const currentPermissions = {
                ...standardRole.defaultPermissions,
                ...(standardRolePermissions[standardRole.id] || {})
            };
            combinedRoles[standardRole.id] = {
                ...standardRole,
                type: 'standard',
                permissions: currentPermissions,
            };
        });

        customRoles.forEach(customRole => {
            combinedRoles[customRole.id] = {
                ...customRole,
                id: customRole.id,
                label: customRole.roleName,
                type: 'custom',
                isDeletable: true,
            };
        });

        const sortedRoles = Object.values(combinedRoles).sort((a, b) => {
            if (a.id === 'Owner') return -1;
            if (b.id === 'Owner') return 1;
            return a.label.localeCompare(b.label);
        });

        return sortedRoles;
    }, [customRoles, standardRolePermissions]);

    const handleOpenModal = (role = null) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };

    const handleSaveRole = async (roleData) => {
        const normalizedRoleName = roleData.roleName || '';
        const isNewCustomRole = !roleData.id && roleData.type === 'custom';

        if ((roleData.type === 'custom' || isNewCustomRole) && !normalizedRoleName.trim()) {
            toast.error('Role name cannot be empty for custom roles.');
            return;
        }

        try {
            if (isNewCustomRole) {
                await addDoc(collection(db, "customRoles"), {
                    roleName: normalizedRoleName,
                    permissions: roleData.permissions,
                    ownerId: user.uid,
                    createdAt: serverTimestamp()
                });
            } else if (roleData.type === 'custom') {
                await updateDoc(doc(db, "customRoles", roleData.id), {
                    roleName: normalizedRoleName,
                    permissions: roleData.permissions,
                    updatedAt: serverTimestamp()
                });
            } else if (roleData.type === 'standard') {
                const userSettingsRef = doc(db, 'userSettings', user.uid);
                await setDoc(userSettingsRef, {
                    standardRolePermissions: {
                        [roleData.id]: roleData.permissions
                    }
                }, { merge: true });
            }
            toast.success('Role saved successfully!');
            handleCloseModal();
        } catch (error) {
            console.error("Error saving role:", error);
            toast.error('Failed to save role.');
        }
    };

    const handleDeleteRole = async (roleId, roleType) => {
        if (roleType === 'standard') {
            if (window.confirm(`Are you sure you want to reset permissions for this built-in role to its default? This cannot be undone.`)) {
                try {
                    const userSettingsRef = doc(db, 'userSettings', user.uid);
                    await updateDoc(userSettingsRef, {
                        [`standardRolePermissions.${roleId}`]: deleteField()
                    });
                    toast.success('Built-in role permissions reset to default.');
                } catch (error) {
                    console.error("Error resetting standard role permissions:", error);
                    toast.error('Failed to reset built-in role permissions.');
                }
            }
            return;
        }
        if (window.confirm("Are you sure you want to delete this custom role?")) {
            try {
                await deleteDoc(doc(db, "customRoles", roleId));
                toast.success("Custom role deleted successfully.");
            } catch (error) {
                console.error("Error deleting custom role:", error);
                toast.error('Failed to delete custom role.');
            }
        }
    };

    return (
        <SettingsPanel title="Roles & Permissions">
             <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Define custom roles for your team members.</p>
                <button onClick={() => handleOpenModal()} className="button-primary"><Plus size={16} className="mr-2" /> Create Role</button>
            </div>
             <div className="border-t border-gray-200 dark:border-gray-700">
                {loading && (customRoles.length === 0 && STANDARD_ROLES.length === 0) ? (
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
                                    {role.isDeletable && (
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

// --- Main Settings View Component ---
const SettingsView = ({ user, userData }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [profileName, setProfileName] = useState(user.displayName || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const { themeSetting, setThemeSetting } = useContext(ThemeContext);
    const [notifications, setNotifications] = useState({});

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
                setCurrency(settingsData.currency || 'USD');
                setTimezone(settingsData.timezone || 'UTC');
                setLanguage(settingsData.language || 'en');
            } else {
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
            toast.error('Display name cannot be empty.');
            return;
        }
        setIsSavingProfile(true);
        setProfileError('');
        const toastId = toast.loading("Updating profile...");
        try {
            await updateProfile(auth.currentUser, { displayName: profileName });
            await updateDoc(doc(db, 'users', user.uid), { displayName: profileName });
            toast.update(toastId, { render: "Profile updated successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (err) {
            setProfileError('Failed to update profile.');
            toast.update(toastId, { render: "Failed to update profile.", type: "error", isLoading: false, autoClose: 5000 });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error("Please select a valid image file.");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading("Uploading picture...");
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);

        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            await updateDoc(doc(db, "users", user.uid), { photoURL: downloadURL });

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL: downloadURL });
            }
            
            toast.update(toastId, { render: "Profile picture updated!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            toast.update(toastId, { render: "Upload failed. Please try again.", type: "error", isLoading: false, autoClose: 5000 });
        } finally {
            setIsUploading(false);
        }
    };

    const handleNotificationChange = async (key, value) => {
        const newNotifications = { ...notifications, [key]: value };
        setNotifications(newNotifications);
        await setDoc(doc(db, 'userSettings', user.uid), { notifications: newNotifications }, { merge: true });
    };

    const handleLocalizationSave = async (e) => {
        e.preventDefault();
        setIsSavingLocalization(true);
        const toastId = toast.loading("Updating localization settings...");
        try {
            await setDoc(doc(db, 'userSettings', user.uid), {
                currency: currency,
                timezone: timezone,
                language: language
            }, { merge: true });
            toast.update(toastId, { render: "Settings updated successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (err) {
            console.error("Error updating localization settings:", err);
            toast.update(toastId, { render: "Failed to update settings.", type: "error", isLoading: false, autoClose: 5000 });
        } finally {
            setIsSavingLocalization(false);
        }
    };

    const currencyOptions = [
        { value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' },
        { value: 'JPY', label: 'JPY (¥)' }, { value: 'CAD', label: 'CAD ($)' }, { value: 'AUD', label: 'AUD ($)' },
    ];
    const timezoneOptions = [
        { value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'Eastern Time (ET)' },
        { value: 'America/Chicago', label: 'Central Time (CT)' }, { value: 'America/Denver', label: 'Mountain Time (MT)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' }, { value: 'Europe/London', label: 'London (GMT/BST)' },
    ];
    const languageOptions = [
        { value: 'en', label: 'English', flagClass: 'fi fi-us' }, { value: 'es', label: 'Spanish', flagClass: 'fi fi-es' },
        { value: 'fr', label: 'French', flagClass: 'fi fi-fr' },
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
                        <SettingsTab id="subscription" label="Subscription" icon={CreditCard} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SettingsTab id="roles" label="Roles & Permissions" icon={Shield} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SettingsTab id="appearance" label="Appearance" icon={Palette} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SettingsTab id="notifications" label="Notifications" icon={Bell} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SettingsTab id="localization" label="Localization" icon={Globe} activeTab={activeTab} setActiveTab={setActiveTab} />
                        <SettingsTab id="account" label="Account" icon={AlertCircle} activeTab={activeTab} setActiveTab={setActiveTab} />
                    </nav>
                </aside>

                <main className="flex-1">
                    {activeTab === 'profile' && (
                        <SettingsPanel title="Profile Information">
                            <div className="space-y-6 max-w-lg">
                                <div className="flex items-center gap-6">
                                    <img
                                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random&size=128`}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700"
                                    />
                                    <div>
                                        <label htmlFor="picture-upload" className="button-primary cursor-pointer">
                                            <Upload size={16} className="mr-2"/>
                                            {isUploading ? 'Uploading...' : 'Upload New Picture'}
                                        </label>
                                        <input
                                            id="picture-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handlePictureUpload}
                                            disabled={isUploading}
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Recommended: Square image.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileSave} className="space-y-4 pt-6 border-t dark:border-gray-700">
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
                            </div>
                        </SettingsPanel>
                    )}
                    {activeTab === 'subscription' && (
                        <SettingsPanel title="Subscription & Billing">
                           <SubscriptionPanel user={user} userData={userData} />
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
                    {activeTab === 'localization' && (
                        <SettingsPanel title="Localization Settings">
                            <form onSubmit={handleLocalizationSave} className="space-y-4 max-w-lg">
                                <div>
                                    <label htmlFor="currency-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                                    <select id="currency-select" value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 input-style">
                                        {currencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="timezone-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
                                    <select id="timezone-select" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-1 input-style">
                                        {timezoneOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <CustomSelect id="language-select" labelText="Language" options={languageOptions} value={language} onChange={setLanguage} />
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

export default SettingsView;