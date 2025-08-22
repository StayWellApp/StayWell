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
    // isChatOpen state is no longer needed

    const { hasPermission, loadingPermissions } = usePermissions(userData);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
                setUserData(null);
                setIsLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const unsubscribeSnapshot = onSnapshot(userDocRef, 
                (doc) => {
                    if (doc.exists()) {
                        setUserData(doc.data());
                    } else {
                        setUserData(null);
                    }
                    setIsLoading(false);
                },
                (error) => {
                    console.error("Firestore snapshot error:", error);
                    setIsLoading(false);
                }
            );
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
            case 'chat': // Add case for chat view
                return <ChatLayout userData={userData} />;
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

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><p className="text-gray-500">Loading StayWell...</p></div>;
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
    
    if (loadingPermissions || !userData) {
        return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"><p className="text-gray-500">Loading User Profile...</p></div>;
    }

    return (
        <ThemeProvider>
            <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            
            <Layout user={user} userData={userData} activeView={activeView} setActiveView={handleSetActiveView} hasPermission={hasPermission}>
                {renderActiveView()}
            </Layout>
            
            {/* Floating button now sets the active view to 'chat' */}
            <div className="fixed bottom-4 right-4 z-50">
                <button onClick={() => setActiveView('chat')} className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                    <MessageSquare size={24} />
                </button>
            </div>
            
        </ThemeProvider>
    );
}

export default App;