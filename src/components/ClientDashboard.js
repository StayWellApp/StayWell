
import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, getDocs, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { DashboardLayout } from './Layout';
import { PropertyDetailView, PropertyCard, PropertyForm } from './PropertyViews';
import { StorageView } from './StorageViews'; // Import the new Storage component

export default function ClientDashboard({ onLogout, user }) {
    const [view, setView] = useState('properties'); // properties, team, or storage
    
    return (
        <DashboardLayout onLogout={onLogout} user={user}>
            <div className="max-w-7xl mx-auto">
                <div className="flex border-b mb-6">
                    <button onClick={() => setView('properties')} className={`px-4 py-2 text-lg font-semibold ${view === 'properties' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>My Properties</button>
                    <button onClick={() => setView('team')} className={`px-4 py-2 text-lg font-semibold ${view === 'team' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>My Team</button>
                    <button onClick={() => setView('storage')} className={`px-4 py-2 text-lg font-semibold ${view === 'storage' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Storage</button>
                </div>
                {view === 'properties' && <PropertiesView user={user} />}
                {view === 'team' && <TeamView user={user} />}
                {view === 'storage' && <StorageView user={user} />}
            </div>
        </DashboardLayout>
    );
};

const PropertiesView = ({ user }) => {
    const [properties, setProperties] = useState([]);
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "properties"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const propertiesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProperties(propertiesData);
            setLoadingProperties(false);
        }, (error) => { console.error("Error fetching properties: ", error); setLoadingProperties(false); });
        return () => unsubscribe();
    }, [user]);

    const handleAddProperty = async (propertyData) => {
        try {
            await addDoc(collection(db, "properties"), { ...propertyData, ownerId: user.uid, createdAt: serverTimestamp() });
            setShowAddForm(false);
        } catch (error) { console.error("Error adding property: ", error); alert("Failed to add property."); }
    };

    const handleSelectProperty = (property) => {
        const propertyRef = doc(db, 'properties', property.id);
        onSnapshot(propertyRef, (doc) => {
            setSelectedProperty({ id: doc.id, ...doc.data() });
        });
    };

    if (selectedProperty) {
        return <PropertyDetailView property={selectedProperty} onBack={() => setSelectedProperty(null)} user={user} />;
    }

    return (
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg">
            <div className="flex justify-end items-center mb-6"><button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">{showAddForm ? 'Cancel' : '+ Add Property'}</button></div>
            {showAddForm && <PropertyForm onSave={handleAddProperty} onCancel={() => setShowAddForm(false)} />}
            <div className="mt-8">
                {loadingProperties ? <p>Loading properties...</p> : properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map(prop => <PropertyCard key={prop.id} property={prop} onSelect={() => handleSelectProperty(prop)} />)}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg"><p className="text-gray-500">You haven't added any properties yet.</p><p className="text-gray-400 text-sm mt-2">Click the button above to get started.</p></div>
                )}
            </div>
        </div>
    );
};

const TeamView = ({ user }) => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [inviteEmail, setInviteEmail] = useState("");

    useEffect(() => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userRef, async (doc) => {
            const userData = doc.data();
            if (userData && userData.teamMembers && userData.teamMembers.length > 0) {
                const membersQuery = query(collection(db, 'users'), where('__name__', 'in', userData.teamMembers));
                const membersSnapshot = await getDocs(membersQuery);
                setTeamMembers(membersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                setTeamMembers([]);
            }
        });

        const invitesQuery = query(collection(db, 'invitations'), where('ownerId', '==', user.uid));
        const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
            setInvitations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubscribeUser();
            unsubscribeInvites();
        };
    }, [user]);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;
        try {
            await addDoc(collection(db, 'invitations'), {
                ownerId: user.uid,
                ownerEmail: user.email,
                staffEmail: inviteEmail.toLowerCase(),
                status: 'pending',
                createdAt: serverTimestamp()
            });
            setInviteEmail('');
            alert('Invitation sent!');
        } catch (error) {
            console.error("Error sending invitation:", error);
            alert('Failed to send invitation.');
        }
    };

    return (
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Invite Staff</h3>
            <form onSubmit={handleInvite} className="flex space-x-2 mb-8">
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Enter staff member's email" className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Invite</button>
            </form>

            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Current Team</h3>
            <ul className="space-y-3">
                {teamMembers.map(member => (
                    <li key={member.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{member.email}</p>
                            <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                    </li>
                ))}
            </ul>
             <h3 className="text-2xl font-semibold text-gray-700 mt-8 mb-4">Pending Invitations</h3>
             <ul className="space-y-3">
                {invitations.filter(inv => inv.status === 'pending').map(invite => (
                    <li key={invite.id} className="bg-yellow-50 p-4 rounded-lg flex justify-between items-center">
                        <p className="font-semibold text-yellow-800">{invite.staffEmail}</p>
                        <span className="text-sm text-yellow-600">Pending</span>
                    </li>
                ))}
             </ul>
        </div>
    );
};
