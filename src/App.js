// --- src/App.js ---
// Replace the entire contents of your App.js file with this code.

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { Auth } from './components/Auth';
import Layout from './components/Layout';
import ClientDashboard from './components/ClientDashboard';
// We will create/update these components in the next steps
// import PropertiesView from './components/PropertiesView'; 
// import SettingsView from './components/SettingsView';
// import TeamView from './components/TeamView';
// import MasterCalendarView from './components/MasterCalendarView';

function App() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role);
                }
            } else {
                setUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <ClientDashboard user={user} />;
            case 'properties':
                // This will be the new component for listing all properties
                return <div className="p-8"><h1 className="text-3xl font-bold">Properties View (Coming Soon)</h1></div>;
            case 'calendar':
                // This will be the new master calendar for all properties
                return <div className="p-8"><h1 className="text-3xl font-bold">Master Calendar (Coming Soon)</h1></div>;
            case 'team':
                // This will be the new team management view
                return <div className="p-8"><h1 className="text-3xl font-bold">Team Management (Coming Soon)</h1></div>;
            case 'settings':
                 // This will be the new settings view
                return <div className="p-8"><h1 className="text-3xl font-bold">Settings (Coming Soon)</h1></div>;
            default:
                return <ClientDashboard user={user} />;
        }
    };

    return (
        <div className="App">
            {!user ? (
                <Auth />
            ) : (
                <Layout activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout}>
                    {renderView()}
                </Layout>
            )}
        </div>
    );
}

export default App;
