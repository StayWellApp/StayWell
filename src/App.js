// --- src/App.js ---
// Replace the entire contents of your App.js file with this code.

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// ✨ CORRECTED: Import Login and SignUp separately
import { Login, SignUp } from './components/Auth';
import Layout from './components/Layout';
import ClientDashboard from './components/ClientDashboard';
// We will create/update these components in the next steps
// import PropertiesView from './components/PropertiesView'; 
// import SettingsView from './components/SettingsView';
// import TeamView from './components/TeamView';
// import MasterCalendarView from './components/MasterCalendarView';

// ✨ NEW: A simple component to handle the Auth screen
const AuthScreen = () => {
    const [showLogin, setShowLogin] = useState(true);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <div className="w-full max-w-md">
                {showLogin ? <Login /> : <SignUp />}
                <button
                    onClick={() => setShowLogin(!showLogin)}
                    className="mt-4 text-center w-full text-sm text-blue-600 hover:underline"
                >
                    {showLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
                </button>
            </div>
        </div>
    );
};


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
        return <div className="flex justify-center items-center h-screen font-semibold text-gray-500">Loading Application...</div>;
    }

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <ClientDashboard user={user} />;
            case 'properties':
                return <div className="p-8"><h1 className="text-3xl font-bold">Properties View (Coming Soon)</h1></div>;
            case 'calendar':
                return <div className="p-8"><h1 className="text-3xl font-bold">Master Calendar (Coming Soon)</h1></div>;
            case 'team':
                return <div className="p-8"><h1 className="text-3xl font-bold">Team Management (Coming Soon)</h1></div>;
            case 'settings':
                return <div className="p-8"><h1 className="text-3xl font-bold">Settings (Coming Soon)</h1></div>;
            default:
                return <ClientDashboard user={user} />;
        }
    };

    return (
        <div className="App">
            {!user ? (
                <AuthScreen /> // Use the new AuthScreen component
            ) : (
                <Layout activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout}>
                    {renderView()}
                </Layout>
            )}
        </div>
    );
}

export default App;
