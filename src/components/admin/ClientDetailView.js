import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase-config';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { ArrowLeft, User, Building, Settings, DollarSign, MessageSquare, FolderOpen, BarChart2 } from 'lucide-react';

// Import all tab components
import OverviewTab from './tabs/OverviewTab';
import PropertiesTab from './tabs/PropertiesTab';
import ManagementTab from './tabs/ManagementTab';
import CommunicationTab from './tabs/CommunicationTab';
import BillingTab from './tabs/BillingTab';
import DocumentsTab from './tabs/DocumentsTab';
import ClientAnalyticsView from './tabs/ClientAnalyticsView';

const ClientDetailView = ({ onSelectProperty }) => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [clientData, setClientData] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [allPlans, setAllPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    setLoadingClient(true);
    const unsubClient = onSnapshot(doc(db, "users", clientId), (doc) => {
      if (doc.exists()) {
        setClientData({ id: doc.id, ...doc.data() });
      } else {
        toast.error("Client not found.");
        navigate('/admin/clients');
      }
      setLoadingClient(false);
    });

    setLoadingProperties(true);
    const q = query(collection(db, "properties"), where("ownerId", "==", clientId));
    const unsubProps = onSnapshot(q, (snapshot) => {
      setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingProperties(false);
    });

    setLoadingPlans(true);
    const unsubPlans = onSnapshot(collection(db, "plans"), (snapshot) => {
      setAllPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingPlans(false);
    });

    return () => {
      unsubClient();
      unsubProps();
      unsubPlans();
    };
  }, [clientId, navigate]);

  const handleUpdateNotes = async (updatedNotes) => {
    const clientRef = doc(db, 'users', clientId);
    try {
      await updateDoc(clientRef, { adminNotes: updatedNotes });
      toast.success("Notes updated successfully!");
    } catch (error) {
      toast.error("Failed to update notes.");
    }
  };

  const handleImpersonate = (clientToImpersonate) => {
    console.log(`Impersonating ${clientToImpersonate.fullName} (UID: ${clientToImpersonate.id})`);
    toast.info(`Starting impersonation session for ${clientToImpersonate.companyName}.`);
  };

  const refreshClientData = () => {
    const clientRef = doc(db, "users", clientId);
    onSnapshot(clientRef, (doc) => {
      if (doc.exists()) setClientData({ id: doc.id, ...doc.data() });
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'management', label: 'Management', icon: Settings },
    { id: 'billing', label: 'Billing', icon: DollarSign },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const renderTabContent = () => {
    const planDetails = { planName: clientData.subscriptionTier || 'N/A' };
    const monthlyRevenue = 0;
    const occupancyRate = 0;

    switch (activeTab) {
      case 'overview':
        return <OverviewTab clientData={clientData} properties={properties} loadingProperties={loadingProperties} planDetails={planDetails} monthlyRevenue={monthlyRevenue} occupancyRate={occupancyRate} onUpdateNotes={handleUpdateNotes} />;
      case 'properties':
        return <PropertiesTab properties={properties} loading={loadingProperties} onSelectProperty={onSelectProperty} />;
      case 'management':
        return <ManagementTab client={clientData} refreshClientData={refreshClientData} allPlans={allPlans} loadingPlans={loadingPlans} onImpersonate={handleImpersonate} />;
      case 'billing':
        return <BillingTab client={clientData} />;
      case 'communication':
        return <CommunicationTab client={clientData} />;
      case 'documents':
        return <DocumentsTab client={clientData} />;
      case 'analytics':
        return <ClientAnalyticsView client={clientData} />;
      default:
        return null;
    }
  };

  if (loadingClient || !clientData) {
    return <div className="flex items-center justify-center h-full"><p>Loading client details...</p></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className='flex items-center space-x-4'>
            <button onClick={() => navigate('/admin/clients')} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 mr-4">
                {clientData.companyName ? clientData.companyName.charAt(0) : '?'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{clientData.companyName}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{clientData.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6 px-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-grow p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ClientDetailView;