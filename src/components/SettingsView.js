import React, { useState, useContext, useEffect } from 'react';
import { db } from '../firebase-config';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ThemeContext } from '../contexts/ThemeContext';
import { User, Shield, Palette, Bell, AlertCircle, Plus, Trash2, Edit } from 'lucide-react';
import { PERMISSION_CATEGORIES } from '../config/permissions';

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

    useEffect(() => {
        if (!user) return;
        const userSettingsRef = doc(db, 'userSettings', user.uid);
        const userSettingsUnsub = onSnapshot(userSettingsRef, (docSnap) => {
            if (docSnap.exists()) {
                setNotifications(docSnap.data().notifications || {});
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
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "customRoles"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleOpenModal = (role = null) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };
    const handleSaveRole = async (roleData) => {
        if (!roleData.roleName.trim()) return;
        if (editingRole) {
            await updateDoc(doc(db, "customRoles", editingRole.id), { ...roleData, updatedAt: serverTimestamp() });
        } else {
            await addDoc(collection(db, "customRoles"), { ...roleData, ownerId: user.uid, createdAt: serverTimestamp() });
        }
        handleCloseModal();
    };
    const handleDeleteRole = async (roleId) => {
        if (window.confirm("Are you sure you want to delete this role?")) {
            await deleteDoc(doc(db, "customRoles", roleId));
        }
    };

    return (
        <SettingsPanel title="Roles & Permissions">
             <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Define custom roles for your team members.</p>
                <button onClick={() => handleOpenModal()} className="button-primary"><Plus size={16} className="mr-2" /> Create Role</button>
            </div>
             <div className="border-t border-gray-200 dark:border-gray-700">
                {loading ? <p className="text-center py-4">Loading roles...</p> : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {roles.map(role => (
                            <li key={role.id} className="py-3 flex justify-between items-center">
                                <span className="text-gray-800 dark:text-gray-200 font-medium">{role.roleName}</span>
                                <div className="flex items-center space-x-4">
                                    <button onClick={() => handleOpenModal(role)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><Edit size={16} /></button>
                                    <button onClick={() => handleDeleteRole(role.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><Trash2 size={16} /></button>
                                </div>
                            </li>
                        ))}
                        {roles.length === 0 && !loading && <p className="text-center text-gray-400 py-6">No custom roles created yet.</p>}
                    </ul>
                )}
            </div>
            {isModalOpen && <RoleFormModal onSave={handleSaveRole} onCancel={handleCloseModal} existingRole={editingRole} />}
        </SettingsPanel>
    );
};

// --- CORRECTED: Role Creation/Edit Modal Component ---
const RoleFormModal = ({ onSave, onCancel, existingRole = null }) => {
    const [roleName, setRoleName] = useState(existingRole?.roleName || '');
    const [permissions, setPermissions] = useState(existingRole?.permissions || {});

    const handlePermissionChange = (permissionId) => {
        setPermissions(prev => ({ ...prev, [permissionId]: !prev[permissionId] }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ roleName, permissions });
    };
    
    return (
        // Outermost div: Full screen overlay, removed animation and explicit padding.
        // It now purely serves as a fixed, transparent backdrop that centers its child.
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"> 
            {/* Inner modal box: Uses w-full max-w-2xl for size, and its internal padding. */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl border dark:border-gray-700 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{existingRole ? 'Edit Role' : 'Create New Role'}</h3>
                </div>

                {/* Form Body - properly flexible and scrollable */}
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                    {/* Scrollable Content */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-grow">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role Name</label>
                            <input type="text" value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g., Property Manager" className="mt-1 input-style" required />
                        </div>
                        <div className="space-y-4">
                            {PERMISSION_CATEGORIES.map(category => (
                                <div key={category.id}>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{category.label}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{category.description}</p>
                                    <div className="space-y-2 pl-2 border-l-2 dark:border-gray-600">
                                        {category.permissions.map(perm => (
                                            <label key={perm.id} className="flex items-center space-x-3 cursor-pointer">
                                                <input type="checkbox" checked={!!permissions[perm.id]} onChange={() => handlePermissionChange(perm.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
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