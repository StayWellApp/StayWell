import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
// --- FIX: Import new icons for the restored tabs ---
import { ArrowLeft, User, Building, Settings, DollarSign, MessageSquare, FolderOpen, BarChart2 } from 'lucide-react';

// Import all tab components
import OverviewTab from './tabs/OverviewTab';
import PropertiesTab from './tabs/PropertiesTab';
import ManagementTab from './tabs/ManagementTab';
import CommunicationTab from './tabs/CommunicationTab';
import BillingTab from './tabs/BillingTab';
import DocumentsTab from './tabs/DocumentsTab'; // Restored
import ClientAnalyticsView from './tabs/ClientAnalyticsView'; // Restored

const ClientDetailView = ({ client, onBack, onSelectProperty }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [clientData, setClientData] = useState(client);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", client.id), (doc) => {
      if (doc.exists()) {
        setClientData({ id: doc.id, ...doc.data() });
      }
    });
    return () => unsub();
  }, [client.id]);

  useEffect(() => {
    setLoadingProperties(true);
    const q = query(collection(db, "properties"), where("ownerId", "==", client.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const propsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProperties(propsData);
      setLoadingProperties(false);
    }, (error) => {
      console.error("Error fetching properties: ", error);
      setLoadingProperties(false);
    });
    return () => unsubscribe();
  }, [client.id]);
  
  const handleUpdateNotes = async (updatedNotes) => {
    const clientRef = doc(db, 'users', client.id);
    try {
      await updateDoc(clientRef, { adminNotes: updatedNotes });
      toast.success("Notes updated successfully!");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes.");
    }
  };

  // --- FIX: Restored Documents and Analytics tabs ---
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
        return <OverviewTab 
                  clientData={clientData} 
                  properties={properties}
                  loadingProperties={loadingProperties}
                  planDetails={planDetails}
                  monthlyRevenue={monthlyRevenue}
                  occupancyRate={occupancyRate}
                  onUpdateNotes={handleUpdateNotes} 
                />;
      case 'properties':
        // --- FIX: Pass properties and loading state to the tab ---
        return <PropertiesTab properties={properties} loading={loadingProperties} onSelectProperty={onSelectProperty} />;
      case 'management':
        return <ManagementTab client={clientData} />;
       case 'billing':
        return <BillingTab client={clientData} />;
       case 'communication':
         return <CommunicationTab client={clientData} />;
      // --- FIX: Add render cases for the restored tabs ---
      case 'documents':
        return <DocumentsTab client={clientData} />;
      case 'analytics':
        return <ClientAnalyticsView client={clientData} />;
      default:
        return null;
    }
  };

  if (!clientData) {
    return <div>Loading client...</div>;
  }

  return (
    <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className='flex items-center space-x-4'>
                    <button onClick={onBack} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
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
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6 px-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                        activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                    <tab.icon className="mr-2 h-5 w-5" />
                    {tab.label}
                </button>
            ))}
            </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-grow p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {renderTabContent()}
        </div>
    </div>
  );
};

export default ClientDetailView;