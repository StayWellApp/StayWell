import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from "firebase/firestore";
import { Login, SignUp } from './components/Auth';
import Layout from './components/Layout';
import ClientDashboard from './components/ClientDashboard';
import StaffDashboard from './components/StaffDashboard';
import PropertiesView from './components/PropertiesView';
import TeamView from './components/TeamView';
import { PropertyDetailView } from './components/PropertyViews';
import { ChecklistsView } from './components/ChecklistViews';
import { StorageView } from './components/StorageViews';
import MasterCalendarView from './components/MasterCalendarView';
import SettingsView from './components/SettingsView';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProperty, setSelectedProperty] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setLoading(false);
                setUserData(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
                if (doc.exists()) {
                    setUserData(doc.data());
                } else {
                    setUserData(null);
                }
                setLoading(false);
            });
            return () => unsub();
        }
    }, [user]);

    const handleSelectProperty = (property) => {
        setSelectedProperty(property);
        setActiveView('propertyDetail');
    };

    // --- MORE ROBUST ACCESS CONTROL LOGIC ---
    const hasAdminPrivileges = () => {
        if (!userData) return false;
        // The user is the Owner if their ID is the same as their ownerId.
        const isOwner = userData.uid === userData.ownerId;
        // Other roles with admin-like access.
        const isAdminOrManager = userData.role === 'Admin' || userData.role === 'Manager' || userData.role === 'Owner';
        return isOwner || isAdminOrManager;
    };
    
    const renderActiveView = () => {
        if (selectedProperty) {
            return <PropertyDetailView property={selectedProperty} onBack={() => setSelectedProperty(null)} user={user} />;
        }
        
        const hasFullAccess = hasAdminPrivileges();
        
        switch (activeView) {
            case 'dashboard':
                return hasFullAccess 
                    ? <ClientDashboard user={user} setActiveView={setActiveView} /> 
                    : <StaffDashboard user={user} userData={userData} />;
            case 'properties':
                return <PropertiesView onSelectProperty={handleSelectProperty} user={user} userData={userData} />;
            case 'team':
                return hasFullAccess ? <TeamView user={user} /> : null;
            case 'templates':
                return hasFullAccess ? <ChecklistsView user={user} /> : null;
            case 'storage':
                return <StorageView user={user} ownerId={userData?.ownerId || user.uid} />;
            case 'calendar':
                return <MasterCalendarView user={user} userData={userData} />;
            case 'settings':
                 return hasFullAccess ? <SettingsView user={user} /> : null;
            default:
                return hasFullAccess 
                    ? <ClientDashboard user={user} setActiveView={setActiveView} /> 
                    : <StaffDashboard user={user} userData={userData} />;
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><p className="text-gray-500">Loading...</p></div>;
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="w-full max-w-md p-4">
                    {isRegistering ? <SignUp /> : <Login />}
                    <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-4 text-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        {isRegistering ? 'Already have an account? Log in.' : "Don't have an account? Sign up."}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ThemeProvider>
            <Layout user={user} userData={userData} activeView={activeView} setActiveView={setActiveView}>
                {renderActiveView()}
            </Layout>
        </ThemeProvider>
    );
}

export default App;