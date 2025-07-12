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
import ChatLayout from './components/ChatLayout';
import { MessageSquare } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import 'flag-icons/css/flag-icons.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const { hasPermission, loadingPermissions } = usePermissions(userData);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                // If there's no user, stop loading and clear data.
                setUser(null);
                setUserData(null);
                setIsLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        // Only run this effect if we have a user object.
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const unsubscribeSnapshot = onSnapshot(userDocRef, 
                (doc) => {
                    // This is the success callback.
                    if (doc.exists()) {
                        setUserData(doc.data());
                    } else {
                        // Handle case where user exists in Auth but not Firestore.
                        setUserData(null);
                    }
                    // We have our answer (or lack thereof), so we can stop loading.
                    setIsLoading(false);
                },
                (error) => {
                    // This is the error callback.
                    console.error("A Firestore permission error occurred. This is likely due to security rules. Please ensure they are deployed correctly.", error);
                    // Stop loading even on error to prevent the app from getting stuck.
                    setIsLoading(false);
                }
            );
            // Cleanup the listener when the component unmounts or user changes.
            return () => unsubscribeSnapshot();
        }
    }, [user]);

    const handleSelectProperty = (property) => {
        setSelectedProperty(property);
        setActiveView('propertyDetail');
    };
    
    const handleSetActiveView = (view) => {
        if (selectedProperty) {
            setSelectedProperty(null);
        }
        setActiveView(view);
    };
    
    const renderActiveView = () => {
        if (loadingPermissions) {
            return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Checking permissions...</p></div>;
        }

        if (selectedProperty) {
            return <PropertyDetailView 
                        property={selectedProperty} 
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

    // First loading screen: waits for auth and initial data fetch attempt.
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><p className="text-gray-500">Loading StayWell...</p></div>;
    }

    // If not loading and still no user, show login page.
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
    
    // Final check: If we have a user but no userData, something is wrong with their profile.
    // Also wait for permissions to be calculated.
    if (loadingPermissions || !userData) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><p className="text-gray-500">Loading User Profile...</p></div>;
    }

    return (
        <ThemeProvider>
            <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            
            <Layout user={user} userData={userData} activeView={activeView} setActiveView={handleSetActiveView} hasPermission={hasPermission}>
                {renderActiveView()}
            </Layout>
            
            {!isChatOpen && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button onClick={() => setIsChatOpen(true)} className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                        <MessageSquare size={24} />
                    </button>
                </div>
            )}
            
            {/* Only render the chat layout if we have the necessary user data */}
            {isChatOpen && userData && <ChatLayout onClose={() => setIsChatOpen(false)} userData={userData} />}
        </ThemeProvider>
    );
}

export default App;
