import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { db } from '../../firebase-config';
import { toast } from 'react-toastify';
import { UserCircleIcon, ChartBarIcon, Cog6ToothIcon, ArrowLeftIcon, BuildingOfficeIcon, CurrencyDollarIcon, TagIcon } from '@heroicons/react/24/outline';
import EditClientModal from './EditClientModal';
import ClientAnalyticsView from './ClientAnalyticsView';
import ClientSubscriptionManager from './ClientSubscriptionManager';
import FeatureFlagManager from './FeatureFlagManager';

const ClientDetailView = ({ client, onBack }) => {
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [subscriptionPlans, setSubscriptionPlans] = useState({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clientData, setClientData] = useState(client);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansCollectionRef = collection(db, 'subscriptionPlans');
        const querySnapshot = await getDocs(plansCollectionRef);
        const plans = {};
        querySnapshot.forEach((doc) => {
          plans[doc.id] = { id: doc.id, ...doc.data() };
        });
        setSubscriptionPlans(plans);
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
        toast.error("Could not load subscription plans.");
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const fetchClientProperties = useCallback(async () => {
    if (!clientData || !clientData.id) return;
    setLoadingProperties(true);
    try {
      const propertiesQuery = query(collection(db, "properties"), where("ownerId", "==", clientData.id));
      const propertiesSnapshot = await getDocs(propertiesQuery);
      const propsList = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProperties(propsList);
    } catch (error) {
      console.error("Error fetching client properties:", error);
    } finally {
      setLoadingProperties(false);
    }
  }, [clientData]);

  useEffect(() => {
    fetchClientProperties();
  }, [fetchClientProperties]);
  
  const refreshClientData = async () => {
      const clientDocRef = doc(db, 'users', client.id); 
      const clientDoc = await getDoc(clientDocRef);
      if (clientDoc.exists()) {
          setClientData({ id: clientDoc.id, ...clientDoc.data() });
      }
  };

  const handleUpdateClient = async (updatedDetails) => {
    const clientDocRef = doc(db, 'users', clientData.id);
    try {
      await updateDoc(clientDocRef, updatedDetails);
      await refreshClientData();
      setIsEditModalOpen(false);
      toast.success("Client details updated successfully!");
    } catch (error) {
      toast.error(`Failed to update client details: ${error.message}`);
    }
  };

  const handleImpersonate = async () => {
      const auth = getAuth();
      const adminUser = auth.currentUser;
      if (!adminUser) return toast.error("Admin user not found.");
      const toastId = toast.loading("Initiating impersonation session...");
      try {
          const functions = getFunctions();
          const createImpersonationToken = httpsCallable(functions, 'createImpersonationToken');
          const result = await createImpersonationToken({ uid: clientData.id });
          localStorage.setItem('impersonating_admin_uid', adminUser.uid);
          await signInWithCustomToken(auth, result.data.token);
          toast.update(toastId, { render: "Successfully signed in!", type: "success", isLoading: false, autoClose: 2000, onClose: () => window.location.reload() });
      } catch (error) {
          localStorage.removeItem('impersonating_admin_uid');
          toast.update(toastId, { render: `Failed: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
      }
  };

  if (!clientData) {
    return <div className="text-center mt-10">Client data is missing.</div>;
  }

  const planId = clientData.subscription?.plan;
  const planDetails = loadingPlans ? null : subscriptionPlans[planId];
  const monthlyRevenue = planDetails && planDetails.pricePerProperty ? (planDetails.pricePerProperty * properties.length) : 0;

  const tabs = [
    { name: 'overview', label: 'Overview', icon: UserCircleIcon },
    { name: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { name: 'management', label: 'Management', icon: Cog6ToothIcon },
  ];

  const OverviewTab = () => (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{clientData.companyName || clientData.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{clientData.email}</p>
                </div>
                <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="button-secondary"
                >
                    Edit Client
                </button>
            </div>
            <div className="mt-6 border-t dark:border-gray-700 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Subscription Status</p>
                    <p className={`text-lg font-semibold ${clientData.subscription?.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {clientData.subscription?.status?.charAt(0).toUpperCase() + clientData.subscription?.status?.slice(1) || 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                    <p className="text-lg text-gray-900 dark:text-gray-200">{clientData.createdAt ? clientData.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>
        </div>
        
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><CurrencyDollarIcon className="w-6 h-6"/>Monthly Revenue</h3>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">${monthlyRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><TagIcon className="w-6 h-6"/>Subscription Details</h3>
                {loadingPlans ? <p className="text-sm text-gray-500">Loading plan details...</p> :
                <div className="mt-2 text-gray-800 dark:text-gray-200">
                    <p><strong>Plan:</strong> {planDetails?.planName || 'Not Subscribed'}</p>
                    <p><strong>Rate:</strong> ${planDetails?.pricePerProperty || 0} / property</p>
                    <p><strong>Properties:</strong> {loadingProperties ? '...' : properties.length}</p>
                </div>}
            </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Properties</h2>
        {loadingProperties ? <p className="text-gray-500 dark:text-gray-400">Loading properties...</p> : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(prop => (
              <div key={prop.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow border dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3"><BuildingOfficeIcon className="w-6 h-6 text-blue-500" /><h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{prop.name}</h3></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{prop.address}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400 border dark:border-gray-700">No properties found.</div>
        )}
      </div>
    </>
  );

  const ManagementTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
          <ClientSubscriptionManager client={clientData} onSubscriptionUpdate={refreshClientData} allPlans={subscriptionPlans} loadingPlans={loadingPlans} />
        </div>
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Admin Actions</h3>
                <button onClick={handleImpersonate} className="button-secondary w-full">Impersonate User</button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">Log in as this user to troubleshoot issues.</p>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <FeatureFlagManager client={clientData} />
            </div>
        </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
       <button onClick={onBack} className="flex items-center gap-2 mb-6 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-semibold">
        <ArrowLeftIcon className="w-5 h-5" />Back to Client List</button>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Client Dashboard</h1>
      <div>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button key={tab.name} onClick={() => setActiveTab(tab.name)}
                className={`${activeTab === tab.name ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}>
                <tab.icon className="w-5 h-5"/>{tab.label}</button>
            ))}
          </nav>
        </div>
        <div className="mt-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'analytics' && <ClientAnalyticsView client={clientData} properties={properties} />}
          {activeTab === 'management' && <ManagementTab />}
        </div>
      </div>
      {isEditModalOpen && <EditClientModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} client={clientData} onSave={handleUpdateClient}/>}
    </div>
  );
};

export default ClientDetailView;