// --- src/components/TeamView.js ---
// Create this new file. It will manage viewing and inviting team members.

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Mail, Shield } from 'lucide-react';

const TeamView = ({ user }) => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);

    // Form state for new invites
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Staff');

    useEffect(() => {
        if (!user) return;
        // Query for users who are part of this owner's team
        const teamQuery = query(collection(db, 'users'), where('ownerId', '==', user.uid));
        const unsubscribe = onSnapshot(teamQuery, (snapshot) => {
            const teamMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeam(teamMembers);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) {
            alert("Please enter an email to send an invite.");
            return;
        }
        // In a real app, you'd trigger a cloud function to send an email.
        // For now, we'll just log it and add a placeholder record.
        console.log(`Inviting ${inviteEmail} as a ${inviteRole}`);
        alert(`Invite functionality is for demonstration. In a real app, an email would be sent to ${inviteEmail}.`);

        // To simulate, you could add to a 'pendingInvites' collection
        // await addDoc(collection(db, "pendingInvites"), {
        //     ownerId: user.uid,
        //     email: inviteEmail,
        //     role: inviteRole,
        //     status: 'pending',
        //     invitedAt: serverTimestamp()
        // });

        setInviteEmail('');
        setInviteRole('Staff');
        setShowInviteForm(false);
    };

    const InviteForm = () => (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 my-6 animate-fade-in-down">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Invite New Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="inviteEmail">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            id="inviteEmail"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="member@example.com"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="inviteRole">Role</label>
                     <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                            id="inviteRole"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option>Staff</option>
                            <option>Admin</option>
                            <option>Cleaner</option>
                            <option>Maintenance</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                     <button type="button" onClick={() => setShowInviteForm(false)} className="bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Send Invite</button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                    <p className="text-gray-600 mt-1">Invite and manage your team members.</p>
                </div>
                <button
                    onClick={() => setShowInviteForm(true)}
                    className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                >
                    <Plus size={18} className="mr-2" />
                    Invite Member
                </button>
            </div>

            {showInviteForm && <InviteForm />}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name / Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-8 text-gray-500">Loading team...</td></tr>
                        ) : (
                            team.map(member => (
                                <tr key={member.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{member.displayName || member.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <a href="#" className="text-blue-600 hover:text-blue-900">Edit</a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamView;
