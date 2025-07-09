import React, { useState, useEffect } from 'react';
import { db, functions } from '../firebase-config';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Plus, Trash2, Send } from 'lucide-react';

// Define the standard, built-in roles
const defaultRoles = ['Manager', 'Cleaner', 'Maintenance', 'Admin'];

const TeamView = ({ user }) => {
    const [team, setTeam] = useState([]);
    const [customRoles, setCustomRoles] = useState([]); // <-- NEW STATE for custom roles
    const [loading, setLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);

    // Combined list of all available roles
    const allAvailableRoles = [...defaultRoles, ...customRoles.map(r => r.roleName)];

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        // Fetch team members
        const teamQuery = query(collection(db, "users"), where("ownerId", "==", user.uid));
        const teamUnsubscribe = onSnapshot(teamQuery, (snapshot) => {
            const teamMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            teamMembers.sort((a, b) => (a.role === 'Owner' ? -1 : b.role === 'Owner' ? 1 : 0));
            setTeam(teamMembers);
            setLoading(false);
        });

        // --- NEW: Fetch custom roles ---
        const rolesQuery = query(collection(db, "customRoles"), where("ownerId", "==", user.uid));
        const rolesUnsubscribe = onSnapshot(rolesQuery, (snapshot) => {
            const rolesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCustomRoles(rolesList);
        });

        return () => {
            teamUnsubscribe();
            rolesUnsubscribe();
        };
    }, [user]);

    const handleRoleChange = async (memberId, newRole) => {
        const memberRef = doc(db, "users", memberId);
        try {
            await updateDoc(memberRef, { role: newRole });
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update role.");
        }
    };

    const handleDeleteMember = async (memberId) => {
        if (window.confirm("Are you sure you want to remove this team member? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "users", memberId));
            } catch (error) {
                console.error("Error deleting team member:", error);
                alert("Failed to delete team member.");
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Team Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Invite, view, and manage roles for your team members.</p>
                </div>
                <button onClick={() => setShowInviteForm(!showInviteForm)} className="button-primary">
                    <Plus size={18} className="-ml-1 mr-2" />
                    Invite Member
                </button>
            </div>

            {showInviteForm && <InviteForm user={user} availableRoles={allAvailableRoles} onInviteSent={() => setShowInviteForm(false)} />}

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
                {loading ? <p className="text-center p-8 text-gray-500">Loading team...</p> : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {team.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{member.displayName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{member.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                            className="input-style py-1.5 text-sm"
                                            disabled={member.role === 'Owner'}
                                        >
                                            <option value="Owner" disabled>{member.role === 'Owner' ? 'Owner' : ''}</option>
                                            
                                            {/* --- UPDATED: Show all default and custom roles --- */}
                                            {allAvailableRoles.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}

                                            {/* Add current role as an option if it's not in the standard list */}
                                            {!allAvailableRoles.includes(member.role) && member.role !== 'Owner' && (
                                                <option value={member.role}>{member.role}</option>
                                            )}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {member.role !== 'Owner' && (
                                            <button onClick={() => handleDeleteMember(member.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const InviteForm = ({ user, availableRoles, onInviteSent }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(availableRoles[0] || '');
    const [isInviting, setIsInviting] = useState(false);
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    
    useEffect(() => {
        if(availableRoles.length > 0 && !role) {
            setRole(availableRoles[0]);
        }
    }, [availableRoles, role]);


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
                        {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
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