// src/App.js

import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { AuthProvider, useAuth, Auth } from './components/Auth';
import { usePermissions } from './hooks/usePermissions';
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

function AppContent() {
    const { currentUser, loading: authLoading } = useAuth(); 
    
    const [userData, setUserData] = useState(null);
    const [allClients, setAllClients] = useState([]); // Central state for all clients
    const [clientsLoading, setClientsLoading] = useState(true); // Loading state for clients
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null); 
    const { hasPermission, loadingPermissions } = usePermissions(userData);
    const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);

    // --- FIX: Centralized and corrected client data fetching ---
    useEffect(() => {
        if (isSuperAdmin) {
            setClientsLoading(true);
            const q = query(collection(db, "users"), where("roles", "array-contains", "client_admin"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllClients(clientsData);
                setClientsLoading(false);
            }, (error) => {
                console.error("Error fetching clients:", error);
                setClientsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setAllClients([]); // Clear clients if not super admin
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        if (currentUser) {
            setIsDataLoading(true);
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    user.getIdTokenResult(true).then(idTokenResult => {
                        const isSuper = idTokenResult.claims.superAdmin === true;
                        setIsSuperAdmin(isSuper);
                        if (!isSuper) {
                            const userDocRef = doc(db, "users", user.uid);
                            onSnapshot(userDocRef, (doc) => {
                                setUserData(doc.exists() ? doc.data() : null);
                                setIsDataLoading(false);
                            });
                        } else {
                            if (!selectedClient) setActiveView('adminDashboard');
                            setIsDataLoading(false);
                        }
                    });
                } else {
                     // Handle user logout
                    setIsSuperAdmin(false);
                    setUserData(null);
                    setSelectedClient(null);
                    setIsDataLoading(false);
                }
            });
            return () => unsubscribe();
        }
    }, [currentUser, selectedClient]);


    const handleSetActiveView = (view) => {
        setSelectedProperty(null);
        setActiveView(view);
    };
    
    const handleSelectClient = (client) => setSelectedClient(client);
    const handleBackToClientList = () => {
        setSelectedClient(null);
        setActiveView('adminClients');
    };
    const handleSelectProperty = (property) => {
        setSelectedProperty(property);
        setActiveView('propertyDetail'); 
    };
    
    const renderActiveView = () => {
        if (isSuperAdmin) {
            if (selectedProperty) return <PropertyDetailView property={selectedProperty} onBack={() => setSelectedProperty(null)} user={currentUser} />;
            if (selectedClient) return <ClientDetailView client={selectedClient} onBack={handleBackToClientList} onSelectProperty={handleSelectProperty} />;
            
            // Pass `allClients` and its loading state as props
            switch (activeView) {
                case 'adminDashboard': return <SuperAdminDashboard allClients={allClients} loading={clientsLoading} onSelectClient={handleSelectClient} setActiveView={handleSetActiveView} />;
                case 'adminClients': return <ClientListView allClients={allClients} loading={clientsLoading} onSelectClient={handleSelectClient} onAddClient={() => setAddClientModalOpen(true)} />;
                case 'adminBilling': return <BillingView />;
                case 'adminSubscriptions': return <AdminSubscriptionsView />;
                case 'adminSettings': return <AdminSettingsView />;
                case 'adminAuditLog': return <AuditLogView />;
                default: return <SuperAdminDashboard allClients={allClients} loading={clientsLoading} onSelectClient={handleSelectClient} setActiveView={handleSetActiveView} />;
            }
        }

        if (selectedProperty) return <PropertyDetailView property={selectedProperty} onBack={() => { setSelectedProperty(null); setActiveView('properties'); }} user={currentUser} />;
        if (loadingPermissions) return <div className="flex items-center justify-center h-full"><p>Checking permissions...</p></div>;

        switch (activeView) {
            case 'dashboard': return hasPermission('properties_view_all') || hasPermission('team_manage') ? <ClientDashboard user={currentUser} setActiveView={handleSetActiveView} /> : <StaffDashboard user={currentUser} userData={userData} />;
            case 'properties': return <PropertiesView onSelectProperty={setSelectedProperty} user={currentUser} userData={userData} hasPermission={hasPermission} />;
            case 'chat': return <ChatLayout userData={userData} />;
            case 'team': return hasPermission('team_manage') ? <TeamView user={currentUser} /> : null;
            case 'templates': return hasPermission('templates_manage') ? <ChecklistsView user={currentUser} /> : null;
            case 'storage': return hasPermission('storage_view') ? <StorageView user={currentUser} ownerId={userData?.ownerId || currentUser.uid} hasPermission={hasPermission} /> : null;
            case 'calendar': return hasPermission('tasks_view_all') ? <MasterCalendarView user={currentUser} userData={userData} /> : <StaffDashboard user={currentUser} userData={userData} />;
            case 'settings': return hasPermission('team_manage') ? <SettingsView user={currentUser} userData={userData} /> : null;
            default: return hasPermission('properties_view_all') ? <ClientDashboard user={currentUser} setActiveView={handleSetActiveView} /> : <StaffDashboard user={currentUser} userData={userData} />;
        }
    };

    if (authLoading || isDataLoading) return <div className="flex items-center justify-center h-screen"><p>Loading StayWell...</p></div>;
    if (!currentUser) return <Auth />;

    return (
        <ThemeProvider>
            <ToastContainer position="bottom-center" autoClose={4000} hideProgressBar={false} />
            <EndImpersonationBanner />
            <Layout user={currentUser} userData={{ ...(userData || {}), isSuperAdmin }} activeView={activeView} setActiveView={handleSetActiveView} hasPermission={hasPermission}>
                {renderActiveView()}
            </Layout>
            {!isSuperAdmin && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button onClick={() => setActiveView('chat')} className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700">
                        <MessageSquare size={24} />
                    </button>
                </div>
            )}
            <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setAddClientModalOpen(false)} />
        </ThemeProvider>
    );
}

function App() {
    return (<AuthProvider><AppContent /></AuthProvider>);
}

export default App;