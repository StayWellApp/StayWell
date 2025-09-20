// src/components/admin/ClientDetailView.js
// Added handleUpdateNotes function to save notes to Firestore.

import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { db } from '../../firebase-config';
import { toast } from 'react-toastify';
import { 
    UserCircleIcon, ChartBarIcon, Cog6ToothIcon, ArrowLeftIcon, BuildingOfficeIcon, 
    ChatBubbleLeftRightIcon, BanknotesIcon, DocumentTextIcon, PencilSquareIcon
} from '@heroicons/react/24/outline';

import EditClientModal from './EditClientModal';
import ClientAnalyticsView from './ClientAnalyticsView';
import OverviewTab from './tabs/OverviewTab';
import PropertiesTab from './tabs/PropertiesTab';
import CommunicationTab from './tabs/CommunicationTab';
import ManagementTab from './tabs/ManagementTab';
import BillingTab from './tabs/BillingTab';
import DocumentsTab from './tabs/DocumentsTab';

const ClientDetailView = ({ client, onBack, onSelectProperty }) => {
    const [properties, setProperties] = useState([]);
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [subscriptionPlans, setSubscriptionPlans] = useState({});
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [clientData, setClientData] = useState(client);

    const fetchClientProperties = useCallback(async () => {
        if (!clientData?.id) return;
        setLoadingProperties(true);
        try {
            const q = query(collection(db, "properties"), where("ownerId", "==", clientData.id));
            const snapshot = await getDocs(q);
            const propsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: 'Active', nextBooking: '2025-10-05', avgNightlyRate: 275 }));
            setProperties(propsList);
        } catch (error) { toast.error("Failed to load properties."); } 
        finally { setLoadingProperties(false); }
    }, [clientData]);

    useEffect(() => {
        const fetchPlans = async () => {
            setLoadingPlans(true);
            try {
                const snapshot = await getDocs(collection(db, 'subscriptionPlans'));
                const plans = {};
                snapshot.forEach(doc => plans[doc.id] = { id: doc.id, ...doc.data() });
                setSubscriptionPlans(plans);
            } catch (error) { toast.error("Could not load subscription plans."); } 
            finally { setLoadingPlans(false); }
        };
        fetchPlans();
        fetchClientProperties();
    }, [fetchClientProperties]);
    
    const refreshClientData = useCallback(async () => {
        const docRef = doc(db, 'users', client.id); 
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.subscription && !data.subscription.startDate) {
                data.subscription.startDate = Timestamp.fromDate(new Date('2025-01-20T00:00:00'));
                data.subscription.renewalDate = Timestamp.fromDate(new Date('2026-01-20T00:00:00'));
            }
            setClientData({ id: docSnap.id, ...data });
        }
    }, [client.id]);
    
    useEffect(() => {
        refreshClientData();
    }, [refreshClientData]);

    const handleUpdateClient = async (updatedDetails) => {
        try {
            await updateDoc(doc(db, 'users', clientData.id), updatedDetails);
            await refreshClientData();
            setIsEditModalOpen(false);
            toast.success("Client details updated successfully!");
        } catch (error) { toast.error(`Failed to update client: ${error.message}`); }
    };

    // --- NEW: Function to handle saving the notes array to Firestore ---
    const handleUpdateNotes = async (updatedNotes) => {
        try {
            await updateDoc(doc(db, 'users', clientData.id), { adminNotes: updatedNotes });
            await refreshClientData(); // Refresh data to show the changes
            toast.success("Notes updated!");
        } catch (error) {
            toast.error(`Failed to update notes: ${error.message}`);
        }
    };

    const handleImpersonate = async () => {
        const auth = getAuth();
        const adminUser = auth.currentUser;
        if (!adminUser) return toast.error("Admin user not found.");
        const toastId = toast.loading("Initiating impersonation...");
        try {
            const functions = getFunctions();
            const createImpersonationToken = httpsCallable(functions, 'createImpersonationToken');
            const result = await createImpersonationToken({ uid: clientData.id });
            localStorage.setItem('impersonating_admin_uid', adminUser.uid);
            await signInWithCustomToken(auth, result.data.token);
            toast.update(toastId, { render: "Success!", type: "success", isLoading: false, autoClose: 2000, onClose: () => window.location.reload() });
        } catch (error) {
            localStorage.removeItem('impersonating_admin_uid');
            toast.update(toastId, { render: `Failed: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    if (!clientData) {
        return <div className="text-center p-10">Client data is missing.</div>;
    }

    const planId = clientData.subscription?.plan;
    const planDetails = loadingPlans ? null : subscriptionPlans[planId];
    const monthlyRevenue = planDetails?.pricePerProperty ? (planDetails.pricePerProperty * properties.length) : 0;
    const occupancyRate = properties.length > 0 ? (properties.filter(p => p.status === 'Active').length / properties.length) * 100 : 0;

    const tabs = [
        { name: 'overview', label: 'Overview', icon: UserCircleIcon }, { name: 'properties', label: 'Properties', icon: BuildingOfficeIcon },
        { name: 'analytics', label: 'Analytics', icon: ChartBarIcon }, { name: 'communication', label: 'Communication', icon: ChatBubbleLeftRightIcon },
        { name: 'billing', label: 'Billing', icon: BanknotesIcon }, { name: 'documents', label: 'Documents', icon: DocumentTextIcon },
        { name: 'management', label: 'Management', icon: Cog6ToothIcon },
    ];

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab 
                            clientData={clientData} 
                            properties={properties} 
                            loadingProperties={loadingProperties}
                            planDetails={planDetails}
                            monthlyRevenue={monthlyRevenue}
                            occupancyRate={occupancyRate}
                            onUpdateNotes={handleUpdateNotes} // Pass the save function
                        />;
            case 'properties':
                return <PropertiesTab properties={properties} loading={loadingProperties} onSelectProperty={onSelectProperty} />;
            case 'analytics':
                return <ClientAnalyticsView client={clientData} properties={properties} />;
            case 'communication':
                return <CommunicationTab />;
            case 'billing':
                return <BillingTab />;
            case 'documents':
                return <DocumentsTab />;
            case 'management':
                return <ManagementTab clientData={clientData} refreshClientData={refreshClientData} allPlans={subscriptionPlans} loadingPlans={loadingPlans} onImpersonate={handleImpersonate}/>;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button onClick={onBack} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-semibold"><ArrowLeftIcon className="w-5 h-5" />Back to Client List</button>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{clientData.companyName || clientData.name}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsEditModalOpen(true)} className="button-secondary flex items-center gap-2"><PencilSquareIcon className="w-5 h-5"/>Edit Client</button>
                </div>
            </div>
            <div>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`${activeTab === tab.name ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}><tab.icon className="w-5 h-5"/>{tab.label}</button>
                        ))}
                    </nav>
                </div>
                <div className="mt-8">{renderActiveTab()}</div>
            </div>
            {isEditModalOpen && <EditClientModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} client={clientData} onSave={handleUpdateClient}/>}
        </div>
    );
};

export default ClientDetailView;