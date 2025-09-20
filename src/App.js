// src/App.js

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/Auth';
import { db } from './firebase-config';
import { doc, onSnapshot } from "firebase/firestore";
import { usePermissions } from './hooks/usePermissions';
import { Auth } from './components/Auth';
import Layout from './components/Layout';
import ClientDashboard from './components/ClientDashboard';
import StaffDashboard from './components/StaffDashboard';
import PropertiesView from './components/PropertiesView';
import TeamView from './components/TeamView';

// --- FIXED IMPORTS ---
// Corrected the path and changed from a named import to a default import.
import PropertyDetailView from './components/property/PropertyDetailView'; 
// Changed from a named import to a default import.
import ChecklistsView from './components/ChecklistViews';
// Changed from a named import to a default import.
import StorageView from './components/StorageViews';

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

// Your application's main logic is now inside AppContent
function AppContent() {
    const { currentUser, loading: authLoading } = useAuth();
    
    const [userData, setUserData] = useState(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null); 
    const { hasPermission, loadingPermissions } = usePermissions(userData);
    const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);

    const handleOpenAddClientModal = () => setAddClientModalOpen(true);
    const handleCloseAddClientModal = () => setAddClientModalOpen(false);

    useEffect(() => {
        if (currentUser) {
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
            setUserData(null);
            setIsSuperAdmin(false);
            setSelectedClient(null);
        }
    }, [currentUser, selectedClient]);

    useEffect(() => {
        if (currentUser && !isSuperAdmin) {
            const userDocRef = doc(db, "users", currentUser.uid);
            const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
                setUserData(doc.exists() ? doc.data() : null);
            }, (error) => console.error("Firestore snapshot error:", error));
            return () => unsubscribeSnapshot();
        }
    }, [currentUser, isSuperAdmin]);

    const handleSetActiveView = (view) => {
        setSelectedProperty(null);
        setSelectedClient(null);
        setActiveView(view);
    };
    
    const handleSelectClient = (client) => setSelectedClient(client);

    const handleBackToClientList = () => {
        setSelectedClient(null);
        setActiveView('adminClients');
    };
    
    const renderActiveView = () => {
        if (isSuperAdmin) {
            if (selectedClient) {
                return <ClientDetailView client={selectedClient} onBack={handleBackToClientList} />;
            }
            switch (activeView) {
                case 'adminDashboard': 
                    return <SuperAdminDashboard 
                                onSelectClient={handleSelectClient} 
                                setActiveView={handleSetActiveView} 
                           />;
                case 'adminClients': 
                    return <ClientListView 
                                onSelectClient={handleSelectClient} 
                                onAddClient={handleOpenAddClientModal} 
                           />;
                case 'adminBilling': return <BillingView />;
                case 'adminSubscriptions': return <AdminSubscriptionsView />;
                case 'adminSettings': return <AdminSettingsView />;
                case 'adminAuditLog': return <AuditLogView />;
                default: 
                    return <SuperAdminDashboard 
                                onSelectClient={handleSelectClient} 
                                setActiveView={handleSetActiveView} 
                           />;
            }
        }

        if (loadingPermissions) {
            return <div className="flex items-center justify-center h-full"><p>Checking permissions...</p></div>;
        }

        if (selectedProperty) {
            return <PropertyDetailView property={selectedProperty} onBack={() => { setSelectedProperty(null); setActiveView('properties'); }} user={currentUser} />;
        }

        switch (activeView) {
            case 'dashboard':
                return hasPermission('properties_view_all') || hasPermission('team_manage') ? <ClientDashboard user={currentUser} setActiveView={handleSetActiveView} /> : <StaffDashboard user={currentUser} userData={userData} />;
            case 'properties':
                return <PropertiesView onSelectProperty={setSelectedProperty} user={currentUser} userData={userData} hasPermission={hasPermission} />;
            case 'chat':
                return <ChatLayout userData={userData} />;
            case 'team':
                return hasPermission('team_manage') ? <TeamView user={currentUser} /> : null;
            case 'templates':
                return hasPermission('templates_manage') ? <ChecklistsView user={currentUser} /> : null;
            case 'storage':
                return hasPermission('storage_view') ? <StorageView user={currentUser} ownerId={userData?.ownerId || currentUser.uid} hasPermission={hasPermission} /> : null;
            case 'calendar':
                return hasPermission('tasks_view_all') ? <MasterCalendarView user={currentUser} userData={userData} /> : <StaffDashboard user={currentUser} userData={userData} />;
            case 'settings':
                return hasPermission('team_manage') ? <SettingsView user={currentUser} userData={userData} /> : null;
            default:
                return hasPermission('properties_view_all') ? <ClientDashboard user={currentUser} setActiveView={handleSetActiveView} /> : <StaffDashboard user={currentUser} userData={userData} />;
        }
    };

    const isImpersonating = !!localStorage.getItem('impersonating_admin_uid');

    if (authLoading) {
        return <div className="flex items-center justify-center h-screen"><p>Loading StayWell...</p></div>;
    }

    if (!currentUser) {
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
                <Layout user={currentUser} userData={{ ...(userData || {}), isSuperAdmin }} activeView={activeView} setActiveView={handleSetActiveView} hasPermission={hasPermission}>
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

// The main App component now simply provides the authentication context to the rest of the app.
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;