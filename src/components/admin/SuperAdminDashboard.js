// src/components/admin/SuperAdminDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { db, auth } from '../../firebase-config';
import { doc, getDoc, setDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import debounce from 'lodash.debounce';
import { PlusCircle, Layout, Save } from 'lucide-react';

// Widget Components
import DashboardMetrics from './DashboardMetrics';
import ClientListWidget from './ClientListWidget';
import NewSignupsPanel from './NewSignupsPanel';
import SubscriptionsEndingSoon from './SubscriptionsEndingSoon';
import CustomerGrowthChart from './CustomerGrowthChart';
import RevenueByPlanChart from './RevenueByPlanChart';

// Helper Components
import DashboardWidgetWrapper from './DashboardWidgetWrapper';
import ManageWidgetsModal from './ManageWidgetsModal';
import AddClientModal from './AddClientModal';
import ClientDetailView from './ClientDetailView';

// Import CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const allWidgets = [
    { id: 'metrics', name: 'Key Metrics', minW: 4, h: 1 },
    { id: 'clientList', name: 'Recent Clients', minW: 2, minH: 3 },
    { id: 'signups', name: 'New Signups', minH: 2 },
    { id: 'endingSoon', name: 'Subscriptions Ending Soon', minH: 2 },
    { id: 'growthChart', name: 'Customer Growth', minW: 2, minH: 2 },
    { id: 'planChart', name: 'Revenue By Plan', minW: 2, minH: 2 },
];

const defaultLayouts = {
    lg: [
        { i: 'metrics', x: 0, y: 0, w: 4, h: 1, isResizable: false },
        { i: 'clientList', x: 0, y: 1, w: 3, h: 4 },
        { i: 'signups', x: 3, y: 1, w: 1, h: 2 },
        { i: 'endingSoon', x: 3, y: 3, w: 1, h: 2 },
        { i: 'growthChart', x: 0, y: 5, w: 2, h: 2 },
        { i: 'planChart', x: 2, y: 5, w: 2, h: 2 },
    ],
};

const SuperAdminDashboard = ({ onSelectClient: propOnSelectClient, setActiveView }) => {
    const [layouts, setLayouts] = useState(null);
    const [clients, setClients] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [visibleWidgets, setVisibleWidgets] = useState(allWidgets.map(w => w.id));
    const [isWidgetModalOpen, setWidgetModalOpen] = useState(false);
    
    // States from previous version
    const [selectedClient, setSelectedClient] = useState(null);
    const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);

    // Fetch client data
    useEffect(() => {
        const q = query(collection(db, "users"), where("roles", "array-contains", "client_admin"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClients(clientsData);
        }, console.error);
        return () => unsubscribe();
    }, []);

    // Load layout and visible widgets from Firestore
    useEffect(() => {
        const loadConfig = async () => {
            if (auth.currentUser) {
                const configDocRef = doc(db, 'users', auth.currentUser.uid, 'configs', 'dashboard');
                const docSnap = await getDoc(configDocRef);
                if (docSnap.exists()) {
                    const { layouts, visibleWidgets } = docSnap.data();
                    setLayouts(layouts || defaultLayouts);
                    setVisibleWidgets(visibleWidgets || allWidgets.map(w => w.id));
                } else {
                    setLayouts(defaultLayouts);
                }
            }
        };
        loadConfig();
    }, []);

    const saveConfigToFirestore = useCallback(debounce(async (newLayouts, newVisibleWidgets) => {
        if (auth.currentUser) {
            const configDocRef = doc(db, 'users', auth.currentUser.uid, 'configs', 'dashboard');
            const dataToSave = {
                layouts: newLayouts,
                visibleWidgets: newVisibleWidgets
            };
            await setDoc(configDocRef, dataToSave, { merge: true });
        }
    }, 1500), []);

    const onLayoutChange = (layout, newLayouts) => {
        if (isEditing) {
            setLayouts(newLayouts);
        }
    };
    
    const handleWidgetVisibilityChange = (widgetId) => {
        setVisibleWidgets(current => {
            const newVisible = current.includes(widgetId)
                ? current.filter(id => id !== widgetId)
                : [...current, widgetId];
            
            // Also update layout to remove the item
            setLayouts(prevLayouts => {
                const newLg = prevLayouts.lg.filter(item => newVisible.includes(item.i));
                return { ...prevLayouts, lg: newLg };
            });

            return newVisible;
        });
    };
    
    const handleSaveLayout = () => {
        saveConfigToFirestore(layouts, visibleWidgets);
        setIsEditing(false);
    };

    const widgetComponents = {
        metrics: { C: DashboardMetrics, p: { clients } },
        clientList: { C: ClientListWidget, p: { onSelectClient: propOnSelectClient || setSelectedClient, onViewAll: () => setActiveView('adminClients') } },
        signups: { C: NewSignupsPanel, p: { clients } },
        endingSoon: { C: SubscriptionsEndingSoon, p: { clients } },
        growthChart: { C: CustomerGrowthChart, p: { clients } },
        planChart: { C: RevenueByPlanChart, p: { clients } },
    };

    if (selectedClient) return <ClientDetailView client={selectedClient} onBack={() => setSelectedClient(null)} />;
    if (!layouts) return <div className="text-center p-8">Loading Dashboard...</div>;

    const filteredLayouts = { lg: layouts.lg.filter(l => visibleWidgets.includes(l.i)) };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Welcome, Admin!</h1>
                    <p className="text-gray-500 dark:text-gray-400">Here's a snapshot of your platform's performance.</p>
                </div>
                <div className="flex items-center space-x-3">
                    {isEditing ? (
                        <>
                            <button onClick={() => setWidgetModalOpen(true)} className="flex items-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                                <Layout className="h-5 w-5 mr-2" />
                                Manage Widgets
                            </button>
                            <button onClick={handleSaveLayout} className="flex items-center bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors">
                                <Save className="h-5 w-5 mr-2" />
                                Save Layout
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} className="flex items-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                                <Layout className="h-5 w-5 mr-2" />
                                Edit Layout
                            </button>
                            <button onClick={() => setAddClientModalOpen(true)} className="flex items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                                <PlusCircle className="h-5 w-5 mr-2" />
                                Add New Client
                            </button>
                        </>
                    )}
                </div>
            </div>

            <ResponsiveGridLayout
                className={`layout ${isEditing ? 'border-2 border-dashed border-indigo-400 rounded-lg' : ''}`}
                layouts={filteredLayouts}
                onLayoutChange={onLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
                rowHeight={100}
                draggableHandle=".drag-handle"
                isDraggable={isEditing}
                isResizable={isEditing}
            >
                {visibleWidgets.map(widgetId => {
                    const { C, p } = widgetComponents[widgetId];
                    const widgetInfo = allWidgets.find(w => w.id === widgetId);
                    return (
                        <div key={widgetId}>
                            <DashboardWidgetWrapper 
                                title={widgetInfo.name} 
                                isEditing={isEditing} 
                                onRemoveWidget={() => handleWidgetVisibilityChange(widgetId)}
                            >
                                <C {...p} />
                            </DashboardWidgetWrapper>
                        </div>
                    );
                })}
            </ResponsiveGridLayout>

            <ManageWidgetsModal 
                isOpen={isWidgetModalOpen}
                onClose={() => setWidgetModalOpen(false)}
                allWidgets={allWidgets}
                visibleWidgets={visibleWidgets}
                onVisibilityChange={handleWidgetVisibilityChange}
            />
            <AddClientModal 
                isOpen={isAddClientModalOpen} 
                onClose={() => setAddClientModalOpen(false)} 
            />
        </div>
    );
};

export default SuperAdminDashboard;