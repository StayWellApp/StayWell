import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from "firebase/firestore";
import { usePermissions } from './hooks/usePermissions';
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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProperty, setSelectedProperty] = useState(null);

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
        setActiveView('propertyDetail'); // Keep track that we are in a detail view
    };
    
    // --- NEW: Wrapped setActiveView to handle navigation from property detail ---
    const handleSetActiveView = (view) => {
        // When we use the main navigation, we should always exit the property detail view
        if (selectedProperty) {
            setSelectedProperty(null);
        }
        setActiveView(view);
    };
    
    const renderActiveView = () => {
        // --- MODIFIED: Prioritize showing the selected property ---
        if (selectedProperty) {
            return <PropertyDetailView 
                        property={selectedProperty} 
                        // This onBack function now correctly returns to the properties list
                        onBack={() => {
                            setSelectedProperty(null);
                            setActiveView('properties');
                        }} 
                        user={user} 
                    />;
        }
        
        switch (activeView) {
            case 'dashboard':
                return hasPermission('properties_view_all') || hasPermission('team_manage')
                    ? <ClientDashboard user={user} setActiveView={handleSetActiveView} /> 
                    : <StaffDashboard user={user} userData={userData} />;
            case 'properties':
                return <PropertiesView onSelectProperty={handleSelectProperty} user={user} userData={userData} hasPermission={hasPermission} />;
            case 'team':
                return hasPermission('team_manage') ? <TeamView user={user} /> : null;
            case 'templates':
                return hasPermission('templates_manage') ? <ChecklistsView user={user} /> : null;
            case 'storage':
                return hasPermission('storage_view') ? <StorageView user={user} ownerId={userData?.ownerId || user.uid} hasPermission={hasPermission} /> : null;
            case 'calendar':
                return hasPermission('tasks_view_all') ? <MasterCalendarView user={user} userData={userData} /> : <StaffDashboard user={user} userData={userData} />;
            case 'settings':
                 return hasPermission('team_manage') ? <SettingsView user={user} /> : null;
            default:
                return hasPermission('properties_view_all')
                    ? <ClientDashboard user={user} setActiveView={handleSetActiveView} /> 
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
                    <ToastContainer position="bottom-center" />
                </div>
            </div>
        );
    }

    return (
        <ThemeProvider>
            <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            {/* --- MODIFIED: Pass the new handler to Layout --- */}
            <Layout user={user} userData={userData} activeView={activeView} setActiveView={handleSetActiveView} hasPermission={hasPermission}>
                {renderActiveView()}
            </Layout>
        </ThemeProvider>
    );
}

export default App;
