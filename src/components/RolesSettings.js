import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2 } from 'lucide-react';

const RolesSettings = ({ user }) => {
    const [roles, setRoles] = useState([]);
    const [newRoleName, setNewRoleName] = useState('');
    const [loading, setLoading] = useState(true);

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
        if (window.confirm("Are you sure you want to delete this role? This might affect users currently assigned to it.")) {
            try {
                await deleteDoc(doc(db, "customRoles", roleId));
            } catch (error) {
                console.error("Error deleting role:", error);
                alert("Failed to delete role.");
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Manage Roles</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create custom roles for your team members.</p>

            <form onSubmit={handleAddRole} className="mt-6 flex items-center gap-2">
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
                {loading ? <p className="text-center py-4">Loading roles...</p> : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {roles.map(role => (
                            <li key={role.id} className="py-3 flex justify-between items-center">
                                <span className="text-gray-800 dark:text-gray-200">{role.roleName}</span>
                                <button onClick={() => handleDeleteRole(role.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                         {roles.length === 0 && !loading && (
                            <p className="text-center text-gray-400 py-6">No custom roles created yet.</p>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default RolesSettings;