import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from "firebase/firestore";
import { usePermissions } from './hooks/usePermissions'; // <-- Import the hook
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
import 'flag-icons/css/flag-icons.min.css';

function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProperty, setSelectedProperty] = useState(null);

    // --- Use our new permissions hook ---
    const { hasPermission, loadingPermissions } = usePermissions(userData);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setLoadingUser(false);
                setUserData(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
                setUserData(doc.exists() ? doc.data() : null);
                setLoadingUser(false);
            });
            return () => unsub();
        }
    }, [user]);

    const handleSelectProperty = (property) => {
        setSelectedProperty(property);
        setActiveView('propertyDetail');
    };
    
    const renderActiveView = () => {
        if (selectedProperty) {
            // For now, allow anyone with property access to see details.
            // This can be refined later with more specific permissions.
            return <PropertyDetailView property={selectedProperty} onBack={() => setSelectedProperty(null)} user={user} />;
        }
        
        switch (activeView) {
            case 'dashboard':
                // A user with no permissions will see the staff dashboard by default.
                return hasPermission('properties_view_all') || hasPermission('team_manage')
                    ? <ClientDashboard user={user} setActiveView={setActiveView} /> 
                    : <StaffDashboard user={user} userData={userData} />;
            case 'properties':
                return <PropertiesView onSelectProperty={handleSelectProperty} user={user} userData={userData} hasPermission={hasPermission} />;
            case 'team':
                return hasPermission('team_manage') ? <TeamView user={user} /> : null;
            case 'templates':
                return hasPermission('templates_manage') ? <ChecklistsView user={user} /> : null;
            case 'storage':
                 // Let's say viewing storage is a specific permission now
                return hasPermission('storage_view') ? <StorageView user={user} ownerId={userData?.ownerId || user.uid} hasPermission={hasPermission} /> : null;
            case 'calendar':
                // Let's say viewing the master calendar is also a permission
                return hasPermission('tasks_view_all') ? <MasterCalendarView user={user} userData={userData} /> : <StaffDashboard user={user} userData={userData} />; // Or a personal calendar
            case 'settings':
                 return hasPermission('team_manage') ? <SettingsView user={user} /> : null; // Only show settings to admin-like roles
            default:
                return hasPermission('properties_view_all')
                    ? <ClientDashboard user={user} setActiveView={setActiveView} /> 
                    : <StaffDashboard user={user} userData={userData} />;
        }
    };

    const isLoading = loadingUser || loadingPermissions;

    if (isLoading) {
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
            <Layout user={user} userData={userData} activeView={activeView} setActiveView={setActiveView} hasPermission={hasPermission}>
                {renderActiveView()}
            </Layout>
        </ThemeProvider>
    );
}

export default App;