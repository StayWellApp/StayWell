import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase-config';
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { ArrowLeft, User, Building, Settings, DollarSign, MessageSquare, FolderOpen, BarChart2, Edit, Send } from 'lucide-react';

import EditClientModal from './EditClientModal';
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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
    
    const refreshClientData = () => { /* Placeholder for future use */ };

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
        if (loadingClient || !clientData) return null;
        const monthlyRevenue = clientData?.monthlyRevenue || 199;
        const occupancyRate = 85;

        switch (activeTab) {
            case 'overview':
                return <OverviewTab clientData={clientData} properties={properties} monthlyRevenue={monthlyRevenue} occupancyRate={occupancyRate} onUpdateNotes={handleUpdateNotes} setActiveTab={setActiveTab} />;
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
        return <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900"><p>Loading client...</p></div>;
    }

    // --- FIX: Status chip function ---
    const getStatusChip = (status) => {
        switch (status) {
            case 'active': return <div className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</div>;
            case 'trial': return <div className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Trial</div>;
            case 'inactive': return <div className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Inactive</div>;
            default: return <div className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Unknown</div>;
        }
    };

    return (
        <>
            {/* --- FIX: Background is now on the root element --- */}
            <div className="min-h-full bg-gray-50 dark:bg-gray-900">
                {/* Header Section */}
                <div className="bg-white dark:bg-gray-800 shadow-sm pb-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <button onClick={() => navigate('/admin/clients')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                                    </button>
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 text-xl">
                                        {clientData.companyName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{clientData.companyName}</h1>
                                            {/* --- FIX: Status chip is now rendered --- */}
                                            {getStatusChip(clientData.status)}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Joined on {clientData.createdAt?.seconds ? new Date(clientData.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setIsEditModalOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Edit className="h-5 w-5 text-gray-500" /></button>
                                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Send className="h-5 w-5 text-gray-500" /></button>
                                    <button onClick={() => handleImpersonate(clientData)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Impersonate</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs and Content Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                         <nav className="-mb-px flex space-x-8 px-4" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
                                    <tab.icon className="mr-2 h-5 w-5" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="py-8">
                        {renderTabContent()}
                    </div>
                </div>
            </div>

            <EditClientModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} client={clientData}/>
        </>
    );
};

export default ClientDetailView;