import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';
import { signOut, signInWithCustomToken } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, onSnapshot, collection, query, where, updateDoc, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
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

    const [activeTab, setActiveTab] = useState(sessionStorage.getItem('clientDetailTab') || 'overview');

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('clientDetailTab', tabId);
    };
    const [clientData, setClientData] = useState(null);
    const [authUser, setAuthUser] = useState(null);
    const [loadingClient, setLoadingClient] = useState(true);
    const [properties, setProperties] = useState([]);
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [allPlans, setAllPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    const refreshAuthUser = useCallback(async () => {
        try {
            const functions = getFunctions();
            const getUser = httpsCallable(functions, 'getUser');
            const result = await getUser({ uid: clientId });
            setAuthUser(result.data.user);
        } catch (error) {
            console.error("Error fetching auth user:", error);
            toast.error("Failed to fetch latest user data.");
        }
    }, [clientId]);

    useEffect(() => {
        if (!clientId) return;

        refreshAuthUser();

        const unsubClient = onSnapshot(doc(db, "users", clientId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (!Array.isArray(data.adminNotes)) {
                    data.adminNotes = [];
                }
                setClientData({ id: doc.id, ...data });
            } else {
                toast.error("Client not found.");
                navigate('/admin/clients');
            }
            setLoadingClient(false);
        });
        
        const unsubProps = onSnapshot(query(collection(db, "properties"), where("ownerId", "==", clientId)), (snapshot) => { setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoadingProperties(false); });
        const unsubPlans = onSnapshot(collection(db, "plans"), (snapshot) => { setAllPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoadingPlans(false); });
        const unsubLogs = onSnapshot(query(collection(db, "users", clientId, "activity_logs"), orderBy("timestamp", "desc")), (snapshot) => { setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoadingLogs(false); });

        return () => { unsubClient(); unsubProps(); unsubPlans(); unsubLogs(); };
    }, [clientId, navigate, refreshAuthUser]);

    const handleAddNote = async (newNote) => {
        if (!newNote || !newNote.text || !newNote.importance) {
            toast.error("Note content and importance are required.");
            return;
        }

        const clientRef = doc(db, 'users', clientId);
        // --- THIS IS THE FIX ---
        // Replace serverTimestamp() with a standard JavaScript Date object.
        // Firestore will convert this to a Timestamp on its own.
        const noteToAdd = { 
            ...newNote, 
            id: Date.now().toString(), 
            createdAt: new Date(), 
            createdBy: auth.currentUser.displayName || auth.currentUser.email 
        };

        try {
            await updateDoc(clientRef, { adminNotes: arrayUnion(noteToAdd) });
            toast.success("Note added successfully!");
        } catch (error) {
            console.error("Error adding note: ", error);
            toast.error("Failed to add note.");
        }
    };

    const handleDeleteNote = async (noteToDelete) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        
        const clientRef = doc(db, 'users', clientId);
        try {
            await updateDoc(clientRef, { adminNotes: arrayRemove(noteToDelete) });
            toast.success("Note deleted successfully!");
        } catch (error) {
            console.error("Error deleting note: ", error);
            toast.error("Failed to delete note.");
        }
    };
    
    const handleImpersonate = async (clientToImpersonate) => {
        const functions = getFunctions();
        const createImpersonationToken = httpsCallable(functions, 'createImpersonationToken');
        const adminUser = auth.currentUser;

        if (!adminUser) {
            toast.error("Authentication error. Please sign in again.");
            return;
        }

        localStorage.setItem('impersonating_admin_uid', adminUser.uid);

        try {
            const result = await createImpersonationToken({ uid: clientToImpersonate.id });
            const token = result.data.token;

            if (token) {
                await signOut(auth);
                await signInWithCustomToken(auth, token);
                navigate('/dashboard');
            } else {
                toast.error("Failed to generate impersonation token.");
            }
        } catch (error) {
            console.error("Impersonation error:", error);
            toast.error(`An error occurred: ${error.message}`);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User }, { id: 'properties', label: 'Properties', icon: Building },
        { id: 'management', label: 'Management', icon: Settings }, { id: 'billing', label: 'Billing', icon: DollarSign },
        { id: 'communication', label: 'Communication', icon: MessageSquare }, { id: 'documents', label: 'Documents', icon: FolderOpen },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    ];

    const renderTabContent = () => {
        if (loadingClient || !clientData || !authUser) return null;
        const monthlyRevenue = clientData?.monthlyRevenue || 199;
        const occupancyRate = 85;

        const combinedClientData = { ...clientData, ...authUser };

        switch (activeTab) {
            case 'overview':
                return <OverviewTab 
                            clientData={combinedClientData} 
                            properties={properties} 
                            monthlyRevenue={monthlyRevenue} 
                            occupancyRate={occupancyRate} 
                            onAddNote={handleAddNote}
                            onDeleteNote={handleDeleteNote}
                            setActiveTab={setActiveTab}
                            activityLogs={activityLogs}
                            loadingLogs={loadingLogs}
                        />;
            case 'properties': return <PropertiesTab properties={properties} loading={loadingProperties} onSelectProperty={onSelectProperty} />;
            case 'management': return <ManagementTab client={combinedClientData} refreshClientData={refreshAuthUser} allPlans={allPlans} loadingPlans={loadingPlans} onImpersonate={handleImpersonate} />;
            case 'billing': return <BillingTab client={combinedClientData} />;
            
            // --- FIX: Updated prop to pass clientId to the new CommunicationTab component ---
            case 'communication': return <CommunicationTab clientId={clientId} />;
            
            case 'documents': return <DocumentsTab client={combinedClientData} />;
            case 'analytics': return <ClientAnalyticsView client={combinedClientData} />;
            default: return null;
        }
    };
    
    if (loadingClient || !clientData) { return <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900"><p>Loading client...</p></div>; }

    const getStatusChip = (status) => {
        const colors = { active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", trial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", inactive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" };
        return <div className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 dark:bg-gray-700'}`}>{status}</div>;
    };

    return (
        <>
            <div className="min-h-full bg-gray-50 dark:bg-gray-900">
                <div className="py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                            <div className="px-4 sm:px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <button onClick={() => navigate('/admin/clients')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft className="h-5 w-5 text-gray-500" /></button>
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 text-xl">{clientData.companyName.charAt(0)}</div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{clientData.companyName}</h1>
                                                {getStatusChip(clientData.status)}
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Joined on {clientData.createdAt?.seconds ? new Date(clientData.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => setIsEditModalOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Edit className="h-5 w-5 text-gray-500" /></button>
                                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Send className="h-5 w-5 text-gray-500" /></button>
                                        <button onClick={() => handleImpersonate(clientData)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Impersonate</button>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700">
                                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                                    {tabs.map((tab) => (
                                        <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={`${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
                                            <tab.icon className="mr-2 h-5 w-5" />{tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                        <div className="mt-8">{renderTabContent()}</div>
                    </div>
                </div>
            </div>
            <EditClientModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} client={clientData}/>
        </>
    );
};

export default ClientDetailView;