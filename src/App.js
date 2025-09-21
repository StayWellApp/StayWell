// src/App.js

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { usePermissions } from './hooks/usePermissions';

import { AuthProvider, useAuth, Auth } from './components/Auth'; 
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
    const [allClients, setAllClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isUserDataLoading, setIsUserDataLoading] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const { hasPermission, loadingPermissions } = usePermissions(userData);
    const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);

    useEffect(() => {
        if (isSuperAdmin) {
            setClientsLoading(true);
            const q = query(collection(db, "users"), where("role", "==", "owner"));
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
            setAllClients([]);
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        if (currentUser) {
            setIsUserDataLoading(true);
            currentUser.getIdTokenResult(true).then(idTokenResult => {
                const isSuper = idTokenResult.claims.superAdmin === true;
                setIsSuperAdmin(isSuper);
                if (isSuper) {
                    if (!selectedClient) setActiveView('adminDashboard');
                    setIsUserDataLoading(false);
                } else {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
                        setUserData(doc.exists() ? doc.data() : null);
                        setIsUserDataLoading(false);
                    }, (error) => {
                        console.error("Firestore snapshot error:", error);
                        setIsUserDataLoading(false);
                    });
                    return () => unsubscribeSnapshot();
                }
            });
        } else {
            setUserData(null);
            setIsSuperAdmin(false);
            setSelectedClient(null);
            setIsUserDataLoading(false);
        }
    }, [currentUser]); // <-- FIX: Removed selectedClient from dependency array
    
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
    const isImpersonating = !!localStorage.getItem('impersonating_admin_uid');

    if (authLoading) return <div className="flex items-center justify-center h-screen"><p>Loading StayWell...</p></div>;
    if (!currentUser) return <Auth />;
    if (!isSuperAdmin && !isImpersonating && (loadingPermissions || isUserDataLoading)) return <div className="flex items-center justify-center h-screen"><p>Loading User Profile...</p></div>;

    return (
        <ThemeProvider>
            <ToastContainer position="bottom-center" autoClose={4000} hideProgressBar={false} />
            <EndImpersonationBanner />
            <div className={isImpersonating ? 'pt-10' : ''}>
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
            </div>
            <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setAddClientModalOpen(false)} />
        </ThemeProvider>
    );
}

function App() {
    return (<AuthProvider><AppContent /></AuthProvider>);
}

export default App;