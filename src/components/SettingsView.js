import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Shield, Plus, Trash2, Edit } from 'lucide-react';
import { PERMISSION_CATEGORIES } from '../config/permissions'; // <-- Import the new permissions config

const RoleFormModal = ({ onSave, onCancel, existingRole = null }) => {
    const [roleName, setRoleName] = useState(existingRole?.roleName || '');
    const [permissions, setPermissions] = useState(existingRole?.permissions || {});

    const handlePermissionChange = (permissionId) => {
        setPermissions(prev => ({
            ...prev,
            [permissionId]: !prev[permissionId]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ roleName, permissions });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl border dark:border-gray-700 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {existingRole ? 'Edit Role' : 'Create New Role'}
                    </h3>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role Name</label>
                            <input
                                type="text"
                                value={roleName}
                                onChange={e => setRoleName(e.target.value)}
                                placeholder="e.g., Property Manager"
                                className="mt-1 input-style"
                                required
                            />
                        </div>
                        <div className="space-y-4">
                            {PERMISSION_CATEGORIES.map(category => (
                                <div key={category.id}>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{category.label}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{category.description}</p>
                                    <div className="space-y-2 pl-2 border-l-2 dark:border-gray-600">
                                        {category.permissions.map(perm => (
                                            <label key={perm.id} className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!permissions[perm.id]}
                                                    onChange={() => handlePermissionChange(perm.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                        <button type="submit" className="button-primary">Save Role</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const SettingsView = ({ user }) => {
    // Component state
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    // Fetch custom roles from Firestore
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "customRoles"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rolesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoles(rolesList);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // Handlers for opening/closing the modal
    const handleOpenModal = (role = null) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };

    // Handler for saving a new or edited role
    const handleSaveRole = async (roleData) => {
        if (!roleData.roleName.trim()) {
            alert("Role name cannot be empty.");
            return;
        }

        if (editingRole) {
            // Update existing role
            const roleRef = doc(db, "customRoles", editingRole.id);
            await updateDoc(roleRef, { ...roleData, updatedAt: serverTimestamp() });
        } else {
            // Create new role
            await addDoc(collection(db, "customRoles"), {
                ...roleData,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });
        }
        handleCloseModal();
    };

    // Handler for deleting a role
    const handleDeleteRole = async (roleId) => {
        if (window.confirm("Are you sure you want to delete this role? This might affect users currently assigned to it.")) {
            await deleteDoc(doc(db, "customRoles", roleId));
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage roles and permissions for your workspace.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Roles & Permissions</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create custom roles for your team members.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="button-primary">
                        <Plus size={16} className="mr-2" />
                        Create Role
                    </button>
                </div>

                <div className="mt-6 border-t border-gray-200 dark:border-gray-700">
                    {loading ? <p className="text-center py-4">Loading roles...</p> : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {roles.map(role => (
                                <li key={role.id} className="py-3 flex justify-between items-center">
                                    <span className="text-gray-800 dark:text-gray-200 font-medium">{role.roleName}</span>
                                    <div className="flex items-center space-x-4">
                                        <button onClick={() => handleOpenModal(role)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteRole(role.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                            {roles.length === 0 && !loading && (
                                <p className="text-center text-gray-400 py-6">No custom roles created yet.</p>
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {isModalOpen && <RoleFormModal onSave={handleSaveRole} onCancel={handleCloseModal} existingRole={editingRole} />}
        </div>
    );
};

export default SettingsView;