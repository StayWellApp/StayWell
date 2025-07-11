import React, { useState, useEffect, useContext } from 'react';
import { db, functions } from '../firebase-config'; // functions is imported for inviteUser callable function
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'; // Added setDoc, serverTimestamp
import { httpsCallable } from 'firebase/functions'; // For Cloud Functions
import { Plus, Trash2, Edit, UserPlus, ListTree, X, Send } from 'lucide-react';
// import { AuthContext } from '../contexts/AuthContext'; // Commented out: AuthContext not provided
import { PERMISSION_CATEGORIES } from '../config/permissions'; // Import PERMISSION_CATEGORIES

// Define the standard, built-in roles as objects with id and label
const STANDARD_ROLES = [
    { id: 'Admin', label: 'Admin' },
    { id: 'Manager', label: 'Manager' },
    { id: 'Cleaner', label: 'Cleaner' },
    { id: 'Maintenance', label: 'Maintenance' },
];

// Reusable Modal Component (defined locally for now, can be moved to its own file)
const TeamMemberFormModal = ({ onSave, onCancel, existingMember = null, allAvailableRoles }) => { // Added allAvailableRoles prop
    const [email, setEmail] = useState(existingMember?.email || '');
    // Initialize role: use existing role, or first available role, or empty if none
    const [role, setRole] = useState(existingMember?.role || (allAvailableRoles.length > 0 ? allAvailableRoles[0].id : ''));
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({ email, role });
        setIsSaving(false);
    };
    
    return (
        <div className="fixed inset-0 grid place-items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{existingMember ? 'Edit Team Member' : 'Invite Team Member'}</h3>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="member@example.com"
                                className="mt-1 input-style"
                                required
                                disabled={!!existingMember} // Email cannot be changed for existing members
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="mt-1 input-style"
                                required
                            >
                                <option value="">Select Role</option>
                                {allAvailableRoles.map(r => ( // Use allAvailableRoles here
                                    <option key={r.id} value={r.id}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end space-x-2 flex-shrink-0">
                        <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                        <button type="submit" disabled={isSaving} className="button-primary">{isSaving ? 'Saving...' : 'Save Member'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// NEW: Property Assignment Modal Component
const PropertyAssignmentModal = ({ teamMember, allProperties, onSave, onCancel }) => {
    const [selectedPropertyIds, setSelectedPropertyIds] = useState(teamMember?.assignedProperties || []);

    const handleCheckboxChange = (propertyId) => {
        setSelectedPropertyIds(prev =>
            prev.includes(propertyId)
                ? prev.filter(id => id !== propertyId)
                : [...prev, propertyId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(teamMember.id, selectedPropertyIds);
    };

    return (
        <div className="fixed inset-0 grid place-items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Assign Properties to {teamMember.displayName}</h3>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                    <div className="p-6 space-y-3 overflow-y-auto flex-grow">
                        {allProperties.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400">No properties available to assign.</p>
                        ) : (
                            allProperties.map(property => (
                                <label key={property.id} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedPropertyIds.includes(property.id)}
                                        onChange={() => handleCheckboxChange(property.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{property.propertyName}</span>
                                </label>
                            ))
                        )}
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end space-x-2 flex-shrink-0">
                        <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                        <button type="submit" className="button-primary">Save Assignments</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const TeamView = ({ user }) => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [properties, setProperties] = useState([]); // State for all properties
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [selectedTeamMemberForAssignment, setSelectedTeamMemberForAssignment] = useState(null);
    // const { currentUser } = useContext(AuthContext); // Commented out: AuthContext not provided

    const [customRoles, setCustomRoles] = useState([]); // State for custom roles from Firebase

    // Fetch custom roles from Firebase
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "customRoles"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Map custom roles to { id: roleName, label: roleName }
            const mappedCustomRoles = snapshot.docs.map(doc => ({ id: doc.data().roleName, label: doc.data().roleName }));
            setCustomRoles(mappedCustomRoles);
        });
        return () => unsubscribe();
    }, [user]);

    // Combine standard roles with custom roles, ensuring no duplicates based on ID
    const allAvailableRoles = Array.from(new Map(
        [...STANDARD_ROLES, ...customRoles].map(item => [item.id, item])
    ).values());

    // Sort roles alphabetically by label
    allAvailableRoles.sort((a, b) => a.label.localeCompare(b.label));


    // Fetch team members
    useEffect(() => {
        if (!user || !user.uid) return;

        const q = query(
            collection(db, "users"),
            where("ownerId", "==", user.uid),
            where("isTeamMember", "==", true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teamMembersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Ensure 'Owner' role is always at the top if present
            teamMembersData.sort((a, b) => {
                if (a.role === 'Owner') return -1;
                if (b.role === 'Owner') return 1;
                return 0;
            });
            setTeamMembers(teamMembersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching team members:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // NEW: Fetch all properties for assignment
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const propertiesCollectionRef = collection(db, "properties");
                const snapshot = await getDocs(propertiesCollectionRef);
                setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching properties:", error);
            }
        };
        fetchProperties();
    }, []);

    const handleOpenInviteModal = (member = null) => {
        setEditingMember(member);
        setIsInviteModalOpen(true);
    };

    const handleCloseInviteModal = () => {
        setIsInviteModalOpen(false);
        setEditingMember(null);
    };

    const handleInviteOrUpdateMember = async (memberData) => {
        // This is a placeholder for actual invitation/update logic.
        // In a real app, inviting would involve sending an email,
        // and updating would modify the user document.
        try {
            if (editingMember) {
                // Update existing member's role (email is disabled)
                const memberRef = doc(db, "users", editingMember.id);
                await updateDoc(memberRef, { role: memberData.role });
                alert('Team member updated successfully!');
            } else {
                // Invite new member (simulated: just create user doc for now)
                // In a real app, this would trigger an invitation email/flow
                const newUserRef = doc(db, "users", memberData.email); // Use email as doc ID for simplicity
                await setDoc(newUserRef, {
                    email: memberData.email,
                    role: memberData.role,
                    ownerId: user.uid, // Link to the owner's account
                    isTeamMember: true,
                    status: 'invited', // e.g., 'invited', 'active'
                    displayName: memberData.email.split('@')[0], // Default display name
                    createdAt: serverTimestamp(),
                    assignedProperties: [] // Initialize assignedProperties as empty
                }, { merge: true }); // Use merge to avoid overwriting if doc exists
                alert('Team member invitation sent (simulated)!');
            }
            handleCloseInviteModal();
        } catch (error) {
            console.error("Error inviting/updating team member:", error);
            alert('Failed to process team member request.');
        }
    };

    const handleDeleteMember = async (memberId, memberName) => {
        if (window.confirm(`Are you sure you want to remove ${memberName} from your team?`)) {
            try {
                await deleteDoc(doc(db, "users", memberId));
                alert(`${memberName} has been removed from your team.`);
            } catch (error) {
                console.error("Error deleting team member:", error);
                alert('Failed to remove team member.');
            }
        }
    };

    // NEW: Open/Close Assignment Modal
    const handleOpenAssignmentModal = (member) => {
        setSelectedTeamMemberForAssignment(member);
        setIsAssignmentModalOpen(true);
    };

    const handleCloseAssignmentModal = () => {
        setIsAssignmentModalOpen(false);
        setSelectedTeamMemberForAssignment(null);
    };

    // NEW: Save Property Assignments
    const handleSavePropertyAssignments = async (teamMemberId, newAssignedProperties) => {
        try {
            const userRef = doc(db, "users", teamMemberId);
            await updateDoc(userRef, { assignedProperties: newAssignedProperties });
            alert('Property assignments updated successfully!');
            handleCloseAssignmentModal();
        } catch (error) {
            console.error("Error updating property assignments:", error);
            alert('Failed to update property assignments.');
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Team Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Invite and manage your team members, assign roles and properties.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in-down">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Team Members</h3>
                    <button onClick={() => handleOpenInviteModal()} className="button-primary"><UserPlus size={16} className="mr-2" /> Invite Member</button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    {loading ? (
                        <p className="text-center py-4 text-gray-500 dark:text-gray-400">Loading team members...</p>
                    ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {teamMembers.length === 0 ? (
                                <p className="text-center py-6 text-gray-400">No team members yet. Invite someone!</p>
                            ) : (
                                teamMembers.map(member => (
                                    <li key={member.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium">{member.displayName || member.email}</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({member.role})</span>
                                            {member.assignedProperties && member.assignedProperties.length > 0 && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Assigned Properties: {member.assignedProperties.length}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={() => handleOpenAssignmentModal(member)}
                                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                                title="Assign Properties"
                                            >
                                                <ListTree size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenInviteModal(member)}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                title="Edit Member"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            {member.id !== user.uid && ( // Prevent self-deletion: Using user.uid here
                                                <button
                                                    onClick={() => handleDeleteMember(member.id, member.displayName || member.email)}
                                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {isInviteModalOpen && (
                <TeamMemberFormModal
                    onSave={handleInviteOrUpdateMember}
                    onCancel={handleCloseInviteModal}
                    existingMember={editingMember}
                    allAvailableRoles={allAvailableRoles} // Pass the combined roles to the modal
                />
            )}

            {isAssignmentModalOpen && selectedTeamMemberForAssignment && (
                <PropertyAssignmentModal
                    teamMember={selectedTeamMemberForAssignment}
                    allProperties={properties}
                    onSave={handleSavePropertyAssignments}
                    onCancel={handleCloseAssignmentModal}
                />
            )}
        </div>
    );
};

const InviteForm = ({ user, allAvailableRoles, onInviteSent }) => { // Changed availableRoles to allAvailableRoles
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(allAvailableRoles.length > 0 ? allAvailableRoles[0].id : ''); // Set initial role from allAvailableRoles
    const [isInviting, setIsInviting] = useState(false);
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    
    useEffect(() => {
        if(allAvailableRoles.length > 0 && (!role || !allAvailableRoles.some(r => r.id === role))) { // Check if current role is still valid
            setRole(allAvailableRoles[0].id); // Use allAvailableRoles here
        }
    }, [allAvailableRoles, role]);

    const handleInvite = async (e) => {
        e.preventDefault();
        setIsInviting(true);
        setFeedback({ message: '', type: '' });

        const inviteUser = httpsCallable(functions, 'inviteUser');
        try {
            const result = await inviteUser({ email, role, ownerId: user.uid, ownerName: user.displayName });
            if (result.data.success) {
                setFeedback({ message: 'Invitation sent successfully!', type: 'success' });
                setEmail('');
            } else {
                throw new Error(result.data.error || 'An unknown error occurred.');
            }
        } catch (error) {
            console.error("Error sending invite:", error);
            setFeedback({ message: `Error: ${error.message}`, type: 'error' });
        } finally {
            setIsInviting(false);
            setTimeout(() => onInviteSent(), 2000);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 animate-fade-in-down">
            <form onSubmit={handleInvite} className="flex flex-col md:flex-row items-end gap-4">
                <div className="w-full">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 input-style"
                        placeholder="teammate@example.com"
                        required
                    />
                </div>
                <div className="w-full md:w-auto">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="mt-1 input-style"
                    >
                        {allAvailableRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                </div>
                <button type="submit" disabled={isInviting} className="button-primary w-full md:w-auto">
                    <Send size={16} className="mr-2"/>
                    {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
            </form>
            {feedback.message && (
                <p className={`mt-2 text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {feedback.message}
                </p>
            )}
        </div>
    );
};

export default TeamView;