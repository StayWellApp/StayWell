// src/App.js

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { usePermissions } from './hooks/usePermissions';

// FIX: REMOVED AuthProvider (it's in index.js)
// We ONLY import useAuth (the hook) and Auth (the component)
import { useAuth, Auth } from './components/Auth';
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

// FIX: REMOVED ThemeProvider (it's in index.js)
// FIX: REMOVED AdminProvider (it's in index.js)
import { useAdmin } from './contexts/AdminContext';

import 'flag-icons/css/flag-icons.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AppContent() {
    const { currentUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { clearSelectedClient } = useAdmin();

    const [userData, setUserData] = useState(null);
    const [allClients, setAllClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isUserDataLoading, setIsUserDataLoading] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedProperty, setSelectedProperty] = useState(null);
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
                // --- FIX: STRAY 'C' CHARACTER REMOVED FROM LINE BELOW ---
                setIsSuperAdmin(isSuper);
                if (!isSuper) {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
                        setUserData(doc.exists() ? doc.data() : null);
                        setIsUserDataLoading(false);
                   }, (error) => {
                        console.error("Firestore snapshot error:", error);
                        setIsUserDataLoading(false);
                    });
                    return () => unsubscribeSnapshot();
                } else {
                    setIsUserDataLoading(false);
                }
           });
        } else {
            setUserData(null);
            setIsSuperAdmin(false);
            clearSelectedClient();
            setIsUserDataLoading(false);
        }
    }, [currentUser, clearSelectedClient]);

    const handleSetActiveView = (view) => {
        setSelectedProperty(null);
        setActiveView(view);
        const path = view.replace('admin', '').toLowerCase();
        navigate(isSuperAdmin ? `/admin/${path}` : `/${path}`);
    };

    const handleSelectProperty = (property) => {
        setSelectedProperty(property);
        navigate(`/property/${property.id}`);
    };

    const AdminRoutes = () => (
        <Routes>
            <Route path="/admin/dashboard" element={<SuperAdminDashboard allClients={allClients} loading={clientsLoading} setActiveView={handleSetActiveView} />} />
            <Route path="/admin/clients" element={<ClientListView allClients={allClients} loading={clientsLoading} onAddClient={() => setAddClientModalOpen(true)} />} />
            <Route path="/admin/clients/:clientId" element={<ClientDetailView onSelectProperty={handleSelectProperty} />} />
            <Route path="/admin/billing" element={<BillingView />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptionsView />} />
            <Route path="/admin/settings" element={<AdminSettingsView />} />
            <Route path="/admin/auditlog" element={<AuditLogView />} />
            <Route path="*" element={<SuperAdminDashboard allClients={allClients} loading={clientsLoading} setActiveView={handleSetActiveView} />} />
        </Routes>
    );

    const UserRoutes = () => {
        if (loadingPermissions) return <div className="flex items-center justify-center h-full"><p>Checking permissions...</p></div>;

        return (
            <Routes>
                <Route path="/dashboard" element={hasPermission('properties_view_all') || hasPermission('team_manage') ? <ClientDashboard user={currentUser} setActiveView={handleSetActiveView} /> : <StaffDashboard user={currentUser} userData={userData} />} />
                <Route path="/properties" element={<PropertiesView onSelectProperty={handleSelectProperty} user={currentUser} userData={userData} hasPermission={hasPermission} />} />
                <Route path="/chat" element={<ChatLayout userData={userData} />} />
                <Route path="/team" element={hasPermission('team_manage') ? <TeamView user={currentUser} /> : null} />
                <Route path="/templates" element={hasPermission('templates_manage') ? <ChecklistsView user={currentUser} /> : null} />
                <Route path="/storage" element={hasPermission('storage_view') ? <StorageView user={currentUser} ownerId={userData?.ownerId || currentUser.uid} hasPermission={hasPermission} /> : null} />
                <Route path="/calendar" element={hasPermission('tasks_view_all') ? <MasterCalendarView user={currentUser} userData={userData} /> : <StaffDashboard user={currentUser} userData={userData} />} />
                <Route path="/settings" element={hasPermission('team_manage') ? <SettingsView user={currentUser} userData={userData} /> : null} />
                <Route path="*" element={hasPermission('properties_view_all') ? <ClientDashboard user={currentUser} setActiveView={handleSetActiveView} /> : <StaffDashboard user={currentUser} userData={userData} />} />
            </Routes>
        );
    };

    const isImpersonating = !!localStorage.getItem('impersonating_admin_uid');

    if (authLoading) return <div className="flex items-center justify-center h-screen"><p>Loading StayWell...</p></div>;
    
    // FIX: This now correctly renders the Auth component
    // (which will be styled by the providers in index.js)
    if (!currentUser) return <Auth />;
  
    if (!isSuperAdmin && !isImpersonating && (loadingPermissions || isUserDataLoading)) return <div className="flex items-center justify-center h-screen"><p>Loading User Profile...</p></div>;

    // FIX: Removed the <ThemeProvider> wrapper from here
    return (
        <>
            <ToastContainer position="bottom-center" autoClose={4000} hideProgressBar={false} />
            <EndImpersonationBanner />
            <div className={isImpersonating ? 'pt-10' : ''}>
                <Layout user={currentUser} userData={{ ...(userData || {}), isSuperAdmin }} activeView={activeView} setActiveView={handleSetActiveView} hasPermission={hasPermission}>
                  {selectedProperty ? 
                        <PropertyDetailView property={selectedProperty} onBack={() => { setSelectedProperty(null); navigate(-1); }} user={currentUser} /> : 
                        (isSuperAdmin ? <AdminRoutes /> : <UserRoutes />)
                    }
                </Layout>
                {!isSuperAdmin && (
                    <div className="fixed bottom-4 right-4 z-50">
                        <button onClick={() => navigate('/chat')} className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700">
                            <MessageSquare size={24} />
        _               </button>
                    </div>
             )}
            </div>
            <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setAddClientModalOpen(false)} />
        </>
    );
}

// FIX: Removed the <AuthProvider> and <AdminProvider> wrappers from here.
// The App component now just renders AppContent.
function App() {
    return (
        <AppContent />
    );
}

export default App;