// src/components/property/PropertySettingsView.js
// This new component handles all property-specific settings, including team access and destructive actions.

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { UserPlus, ShieldAlert, Trash2, Archive } from 'lucide-react';

export const SettingsView = ({ property, user, onBack }) => {
    const [team, setTeam] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [confirmDeleteText, setConfirmDeleteText] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Fetch all team members associated with the account owner
    useEffect(() => {
        const ownerId = user.ownerId || user.uid;
        const teamQuery = query(collection(db, 'users'), where('ownerId', '==', ownerId));
        const unsubscribe = onSnapshot(teamQuery, (snapshot) => {
            setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingTeam(false);
        }, (error) => {
            console.error("Error fetching team:", error);
            toast.error("Could not load team members.");
            setLoadingTeam(false);
        });
        return () => unsubscribe();
    }, [user]);

    // Function to grant or revoke access for a team member
    const handleToggleTeamAccess = async (teamMemberId, hasAccess) => {
        const propertyRef = doc(db, "properties", property.id);
        const toastId = toast.loading(`${hasAccess ? 'Revoking' : 'Granting'} access...`);
        try {
            await updateDoc(propertyRef, {
                assignedTeam: hasAccess ? arrayRemove(teamMemberId) : arrayUnion(teamMemberId)
            });
            toast.update(toastId, { render: "Permissions updated!", type: "success", isLoading: false, autoClose: 2000 });
        } catch (error) {
            console.error("Error updating team access:", error);
            toast.update(toastId, { render: "Failed to update permissions.", type: "error", isLoading: false, autoClose: 4000 });
        }
    };

    // Function to archive the property
    const handleArchiveProperty = async () => {
        if (window.confirm("Are you sure you want to archive this property? It will be hidden from the main dashboard.")) {
            const propertyRef = doc(db, "properties", property.id);
            const toastId = toast.loading("Archiving property...");
            try {
                await updateDoc(propertyRef, { status: 'Archived' });
                toast.update(toastId, { render: "Property archived.", type: "success", isLoading: false, autoClose: 3000 });
                onBack(); // Go back to properties list after archiving
            } catch (error) {
                console.error("Error archiving property:", error);
                toast.update(toastId, { render: "Failed to archive property.", type: "error", isLoading: false, autoClose: 5000 });
            }
        }
    };

    // Function to permanently delete the property
    const handleDeleteProperty = async () => {
        if (confirmDeleteText !== property.propertyName) {
            toast.error("The property name you entered does not match.");
            return;
        }
        const toastId = toast.loading("Deleting property permanently...");
        try {
            await deleteDoc(doc(db, "properties", property.id));
            toast.update(toastId, { render: "Property permanently deleted.", type: "success", isLoading: false, autoClose: 3000 });
            onBack(); // Go back to properties list after deleting
        } catch (error) {
            console.error("Error deleting property:", error);
            toast.update(toastId, { render: "Failed to delete property.", type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    return (
        <>
            <div className="space-y-8">
                {/* Team Access Management */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><UserPlus size={20} className="mr-3 text-blue-500" /> Team Access</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Grant or revoke access to this specific property for your team members.</p>
                    {loadingTeam ? <p>Loading team...</p> : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {team.map(member => {
                                const hasAccess = property.assignedTeam?.includes(member.id);
                                return (
                                    <li key={member.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{member.displayName || member.email}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{member.role || 'Team Member'}</p>
                                        </div>
                                        <label htmlFor={`access-toggle-${member.id}`} className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id={`access-toggle-${member.id}`} className="sr-only peer" checked={hasAccess} onChange={() => handleToggleTeamAccess(member.id, hasAccess)} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-red-200 dark:border-red-500/30 shadow-sm">
                    <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center"><ShieldAlert size={20} className="mr-3" /> Danger Zone</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Archive this property</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">This will hide the property from dashboards and lists.</p>
                            </div>
                            <button onClick={handleArchiveProperty} className="button-secondary-danger"><Archive size={16} className="mr-2"/>Archive</button>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Delete this property</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">This action is permanent and cannot be undone.</p>
                            </div>
                            <button onClick={() => setIsDeleteModalOpen(true)} className="button-danger"><Trash2 size={16} className="mr-2"/>Delete</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-red-600">Confirm Deletion</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">This action is irreversible. To confirm, please type the full name of the property: <strong className="text-gray-900 dark:text-gray-100">{property.propertyName}</strong></p>
                        <input
                            type="text"
                            value={confirmDeleteText}
                            onChange={(e) => setConfirmDeleteText(e.target.value)}
                            className="mt-4 w-full input-style"
                            placeholder="Type property name here"
                        />
                        <div className="flex justify-end space-x-2 pt-6 mt-4 border-t dark:border-gray-700">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="button-secondary">Cancel</button>
                            <button onClick={handleDeleteProperty} className="button-danger" disabled={confirmDeleteText !== property.propertyName}>Delete Property</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};