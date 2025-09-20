// src/components/admin/ClientDetailView.js
// Redesigned as a comprehensive CRM-style client management dashboard

import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { db } from '../../firebase-config';
import { toast } from 'react-toastify';
import { 
    UserCircleIcon, ChartBarIcon, Cog6ToothIcon, ArrowLeftIcon, BuildingOfficeIcon, 
    CurrencyDollarIcon, TagIcon, ClockIcon, CheckCircleIcon, BriefcaseIcon,
    ChatBubbleLeftRightIcon, BanknotesIcon, DocumentTextIcon, PencilSquareIcon, UserGroupIcon
} from '@heroicons/react/24/outline';
import EditClientModal from './EditClientModal';
import ClientAnalyticsView from './ClientAnalyticsView';
import ClientSubscriptionManager from './ClientSubscriptionManager';
import FeatureFlagManager from './FeatureFlagManager';


// --- Placeholder Components for New Tabs ---
const PropertiesTab = ({ properties, loading }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Managed Properties</h3>
        {loading ? <p>Loading properties...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map(prop => (
                    <div key={prop.id} className="border dark:border-gray-700 p-4 rounded-lg">
                        <p className="font-bold">{prop.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{prop.address}</p>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const CommunicationTab = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Communication Log</h3>
        <p className="text-gray-600 dark:text-gray-400">Log emails, calls, and notes here to track client interactions.</p>
        {/* Add your communication logging UI here */}
    </div>
);

const BillingTab = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Billing & Invoices</h3>
        <p className="text-gray-600 dark:text-gray-400">Display payment history, generate invoices, and manage billing details.</p>
        {/* Add your billing management UI here */}
    </div>
);

const DocumentsTab = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Client Documents</h3>
        <p className="text-gray-600 dark:text-gray-400">A central place to upload and manage contracts, agreements, and other files.</p>
        {/* Add your document management UI here */}
    </div>
);


const ClientDetailView = ({ client, onBack }) => {
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
            setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching properties:", error);
            toast.error("Failed to load properties.");
        } finally {
            setLoadingProperties(false);
        }
    }, [clientData]);

    useEffect(() => {
        const fetchPlans = async () => {
            setLoadingPlans(true);
            try {
                const snapshot = await getDocs(collection(db, 'subscriptionPlans'));
                const plans = {};
                snapshot.forEach(doc => plans[doc.id] = { id: doc.id, ...doc.data() });
                setSubscriptionPlans(plans);
            } catch (error) {
                console.error("Error fetching plans:", error);
                toast.error("Could not load subscription plans.");
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchPlans();
        fetchClientProperties();
    }, [fetchClientProperties]);
    
    const refreshClientData = async () => {
        const docRef = doc(db, 'users', client.id); 
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setClientData({ id: docSnap.id, ...docSnap.data() });
        }
    };

    const handleUpdateClient = async (updatedDetails) => {
        try {
            await updateDoc(doc(db, 'users', clientData.id), updatedDetails);
            await refreshClientData();
            setIsEditModalOpen(false);
            toast.success("Client details updated successfully!");
        } catch (error) {
            toast.error(`Failed to update client: ${error.message}`);
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
    const occupancyRate = properties.length > 0 ? (properties.filter(p => p.status === 'Occupied').length / properties.length) * 100 : 0;

    const tabs = [
        { name: 'overview', label: 'Overview', icon: UserCircleIcon },
        { name: 'properties', label: 'Properties', icon: BuildingOfficeIcon },
        { name: 'analytics', label: 'Analytics', icon: ChartBarIcon },
        { name: 'communication', label: 'Communication', icon: ChatBubbleLeftRightIcon },
        { name: 'billing', label: 'Billing', icon: BanknotesIcon },
        { name: 'documents', label: 'Documents', icon: DocumentTextIcon },
        { name: 'management', label: 'Management', icon: Cog6ToothIcon },
    ];

    const OverviewTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-3"><BriefcaseIcon className="w-6 h-6 text-gray-500" />Portfolio Snapshot</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Properties</p>
                            <p className="text-2xl font-bold">{loadingProperties ? '...' : properties.length}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Occupancy Rate</p>
                            <p className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Turn Time</p>
                            <p className="text-2xl font-bold">5 Days</p>
                        </div>
                    </div>
                </div>
                 {/* You can add more overview widgets here, like recent activity */}
            </div>

            {/* Right Column (Sidebar) */}
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-3"><UserGroupIcon className="w-6 h-6 text-gray-500"/>Client Profile</h3>
                    <div className="space-y-3 text-sm">
                        <div><strong>Company:</strong> {clientData.companyName || 'N/A'}</div>
                        <div><strong>Contact:</strong> {clientData.name}</div>
                        <div><strong>Email:</strong> {clientData.email}</div>
                        <div><strong>Member Since:</strong> {clientData.createdAt?.toDate().toLocaleDateString() || 'N/A'}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                     <h3 className="text-xl font-semibold mb-4 flex items-center gap-3"><TagIcon className="w-6 h-6 text-gray-500"/>Subscription</h3>
                     <div className="space-y-3 text-sm">
                        <div><strong>Plan:</strong> {planDetails?.planName || 'Not Subscribed'}</div>
                        <div><strong>Status:</strong> <span className={`font-semibold ${clientData.subscription?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{clientData.subscription?.status || 'N/A'}</span></div>
                        <div><strong>Monthly Revenue:</strong> <span className="font-bold text-blue-600">${monthlyRevenue.toFixed(2)}</span></div>
                     </div>
                </div>
            </div>
        </div>
    );
    
    const ManagementTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <ClientSubscriptionManager client={clientData} onSubscriptionUpdate={refreshClientData} allPlans={subscriptionPlans} loadingPlans={loadingPlans} />
            </div>
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
                    <button onClick={handleImpersonate} className="button-secondary w-full">Impersonate User</button>
                    <p className="text-xs text-center mt-2 text-gray-500">Log in as this user to troubleshoot.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    <FeatureFlagManager client={clientData} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button onClick={onBack} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-semibold">
                        <ArrowLeftIcon className="w-5 h-5" />Back to Client List
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{clientData.companyName || clientData.name}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsEditModalOpen(true)} className="button-secondary flex items-center gap-2">
                        <PencilSquareIcon className="w-5 h-5"/>Edit Client
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button key={tab.name} onClick={() => setActiveTab(tab.name)}
                                className={`${activeTab === tab.name ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}>
                                <tab.icon className="w-5 h-5"/>{tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-8">
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'properties' && <PropertiesTab properties={properties} loading={loadingProperties} />}
                    {activeTab === 'analytics' && <ClientAnalyticsView client={clientData} properties={properties} />}
                    {activeTab === 'communication' && <CommunicationTab />}
                    {activeTab === 'billing' && <BillingTab />}
                    {activeTab === 'documents' && <DocumentsTab />}
                    {activeTab === 'management' && <ManagementTab />}
                </div>
            </div>
            
            {isEditModalOpen && <EditClientModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} client={clientData} onSave={handleUpdateClient}/>}
        </div>
    );
};

export default ClientDetailView;