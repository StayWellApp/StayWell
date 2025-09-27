import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { AdminProvider } from './contexts/AdminContext';
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
  const [selectedProperty, setSelectedProperty] = useState(null);
  const { hasPermission, loadingPermissions } = usePermissions(userData);
  const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuperAdmin) {
      setClientsLoading(true);
      const q = query(collection(db, "users"), where("role", "==", "owner"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAllClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
          setIsUserDataLoading(false);
        } else {
          const unsub = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
            setUserData(doc.exists() ? doc.data() : null);
            setIsUserDataLoading(false);
          });
          return () => unsub();
        }
      });
    } else {
      setUserData(null);
      setIsSuperAdmin(false);
      setIsUserDataLoading(false);
    }
  }, [currentUser]);

  const handleSelectProperty = (property) => {
    setSelectedProperty(property);
    navigate('/property-detail'); // Example of navigating on selection
  };
  
  const AdminLayout = () => (
    <Layout user={currentUser} userData={{ ...(userData || {}), isSuperAdmin }}>
      <Routes>
        <Route path="dashboard" element={<SuperAdminDashboard allClients={allClients} loading={clientsLoading} onAddClient={() => setAddClientModalOpen(true)} />} />
        <Route path="clients" element={<ClientListView allClients={allClients} loading={clientsLoading} onAddClient={() => setAddClientModalOpen(true)} />} />
        <Route path="clients/:clientId" element={<ClientDetailView onSelectProperty={handleSelectProperty} />} />
        <Route path="subscriptions" element={<AdminSubscriptionsView />} />
        <Route path="billing" element={<BillingView />} />
        <Route path="audit-log" element={<AuditLogView />} />
        <Route path="settings" element={<AdminSettingsView />} />
        <Route index element={<Navigate to="dashboard" />} />
      </Routes>
    </Layout>
  );

  const UserLayout = () => {
    // You can define a different layout for non-admin users if needed
    // Or just render the view directly
    return (
        <Layout user={currentUser} userData={userData} hasPermission={hasPermission}>
             {/* This is a simplified version of your non-admin routing */}
             <Routes>
                <Route path="dashboard" element={hasPermission('properties_view_all') ? <ClientDashboard user={currentUser} /> : <StaffDashboard user={currentUser} userData={userData} />} />
                <Route path="properties" element={<PropertiesView onSelectProperty={handleSelectProperty} user={currentUser} userData={userData} hasPermission={hasPermission} />} />
                {/* Add other non-admin routes here */}
                <Route index element={<Navigate to="dashboard" />} />
             </Routes>
        </Layout>
    );
  }

  if (authLoading || isUserDataLoading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading StayWell...</p></div>;
  }
  
  return (
    <>
      <ToastContainer position="bottom-center" autoClose={4000} hideProgressBar={false} />
      <EndImpersonationBanner />
      <div className={!!localStorage.getItem('impersonating_admin_uid') ? 'pt-10' : ''}>
        {!currentUser ? (
          <Auth />
        ) : (
          <Routes>
            {isSuperAdmin ? (
              <Route path="/admin/*" element={<AdminLayout />} />
            ) : (
              <Route path="/*" element={<UserLayout />} />
            )}
             <Route path="*" element={<Navigate to={isSuperAdmin ? "/admin" : "/dashboard"} />} />
          </Routes>
        )}
      </div>
      <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setAddClientModalOpen(false)} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <AppContent />
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;