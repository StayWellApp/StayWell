// src/App.js
// Added logic to handle property selection from the ClientDetailView

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from "firebase/firestore";
import { usePermissions } from './hooks/usePermissions';
import { Auth } from './components/Auth';
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
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
import AdminSettingsView from './components/admin/AdminSettingsView';
import AuditLogView from './components/admin/AuditLogView';
import BillingView from './components/admin/BillingView';
import ClientListView from './components/admin/ClientListView';
import ClientDetailView from './components/admin/ClientDetailView';
import AdminSubscriptionsView from './components/admin/AdminSubscriptionsView';
import EndImpersonationBanner from './components/EndImpersonationBanner';
import AddClientModal from './components/admin/AddClientModal';
import { MessageSquare } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import 'flag-icons/css/flag-icons.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null); 
    const { hasPermission, loadingPermissions } = usePermissions(userData);
    const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);

    const handleOpenAddClientModal = () => setAddClientModalOpen(true);
    const handleCloseAddClientModal = () => setAddClientModalOpen(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                currentUser.getIdTokenResult(true).then(idTokenResult => {
                    if (idTokenResult.claims.superAdmin === true) {
                        setIsSuperAdmin(true);
                        if (!localStorage.getItem('impersonating_admin_uid') && !selectedClient) {
                            setActiveView('adminDashboard');
                        }
                    } else {
                        setIsSuperAdmin(false);
                    }
                });
            } else {
                setUser(null);
                setUserData(null);
                setIsSuperAdmin(false);
                setSelectedClient(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribeAuth();
    }, [selectedClient]);

    useEffect(() => {
        if (user && !isSuperAdmin) {
            const userDocRef = doc(db, "users", user.uid);
            const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
                setUserData(doc.exists() ? doc.data() : null);
            }, (error) => console.error("Firestore snapshot error:", error));
            return () => unsubscribeSnapshot();
        }
    }, [user, isSuperAdmin]);

    const handleSetActiveView = (view) => {
        setSelectedProperty(null);
        // We keep selectedClient here so we can return to it
        setActiveView(view);
    };
    
    const handleSelectClient = (client) => setSelectedClient(client);

    const handleBackToClientList = () => {
        setSelectedClient(null);
        setActiveView('adminClients');
    };

    // --- NEW: Function to handle selecting a property from the client detail view ---
    const handleSelectProperty = (property) => {
        setSelectedProperty(property);
        // You might want a different view for managing properties as an admin
        setActiveView('propertyDetail'); 
    };
    
    const renderActiveView = () => {
        if (isSuperAdmin) {
            if (selectedProperty) {
                 // When a property is selected, show its detail view
                 return <PropertyDetailView property={selectedProperty} onBack={() => setSelectedProperty(null)} user={user} />;
            }
            if (selectedClient) {
                // Pass the new handleSelectProperty function as a prop
                return <ClientDetailView client={selectedClient} onBack={handleBackToClientList} onSelectProperty={handleSelectProperty} />;
            }
            switch (activeView) {
                case 'adminDashboard': return <SuperAdminDashboard onSelectClient={handleSelectClient} setActiveView={handleSetActiveView} />;
                case 'adminClients': return <ClientListView onSelectClient={handleSelectClient} onAddClient={handleOpenAddClientModal} />;
                case 'adminBilling': return <BillingView />;
                case 'adminSubscriptions': return <AdminSubscriptionsView />;
                case 'adminSettings': return <AdminSettingsView />;
                case 'adminAuditLog': return <AuditLogView />;
                default: return <SuperAdminDashboard onSelectClient={handleSelectClient} setActiveView={handleSetActiveView} />;
            }
        }

        // --- Standard user view ---
        if (selectedProperty) {
            return <PropertyDetailView property={selectedProperty} onBack={() => { setSelectedProperty(null); setActiveView('properties'); }} user={user} />;
        }
        
        // ... (rest of the renderActiveView function remains the same)
        if (loadingPermissions) {
            return <div className="flex items-center justify-center h-full"><p>Checking permissions...</p></div>;
        }

        switch (activeView) {
            case 'dashboard':
                return hasPermission('properties_view_all') || hasPermission('team_manage') ? <ClientDashboard user={user} setActiveView={handleSetActiveView} /> : <StaffDashboard user={user} userData={userData} />;
            case 'properties':
                return <PropertiesView onSelectProperty={setSelectedProperty} user={user} userData={userData} hasPermission={hasPermission} />;
            case 'chat':
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
                return hasPermission('team_manage') ? <SettingsView user={user} userData={userData} /> : null;
            default:
                return hasPermission('properties_view_all') ? <ClientDashboard user={user} setActiveView={handleSetActiveView} /> : <StaffDashboard user={user} userData={userData} />;
        }
    };

    const isImpersonating = !!localStorage.getItem('impersonating_admin_uid');

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><p>Loading StayWell...</p></div>;
    }

    if (!user) {
        return <Auth />;
    }

    if (!isSuperAdmin && !isImpersonating && (loadingPermissions || !userData)) {
        return <div className="flex items-center justify-center h-screen"><p>Loading User Profile...</p></div>;
    }

    return (
        <ThemeProvider>
            <ToastContainer position="bottom-center" autoClose={4000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <EndImpersonationBanner />
            <div className={isImpersonating ? 'pt-10' : ''}>
                <Layout user={user} userData={{ ...(userData || {}), isSuperAdmin }} activeView={activeView} setActiveView={handleSetActiveView} hasPermission={hasPermission}>
                    {renderActiveView()}
                </Layout>
                {!isSuperAdmin && (
                    <div className="fixed bottom-4 right-4 z-50">
                        <button onClick={() => setActiveView('chat')} className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                            <MessageSquare size={24} />
                        </button>
                    </div>
                )}
            </div>
            <AddClientModal 
                isOpen={isAddClientModalOpen} 
                onClose={handleCloseAddClientModal} 
            />
        </ThemeProvider>
    );
}

export default App;