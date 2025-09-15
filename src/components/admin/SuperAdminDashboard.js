// src/components/admin/SuperAdminDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { db, auth } from '../../firebase-config';
import { doc, getDoc, setDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import debounce from 'lodash.debounce';

// --- UPDATED: Import ClientListWidget and remove ClientListView ---
import DashboardWidget from '../DashboardWidget';
import ClientListWidget from './ClientListWidget'; // New Widget
import ClientDetailView from './ClientDetailView';
import CustomerGrowthChart from './CustomerGrowthChart';
import RevenueByPlanChart from './RevenueByPlanChart';
import NewSignupsPanel from './NewSignupsPanel';
import SubscriptionsEndingSoon from './SubscriptionsEndingSoon';
import DashboardMetrics from './DashboardMetrics';
import AddClientModal from './AddClientModal';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const defaultLayouts = {
    lg: [
        { i: 'metrics', x: 0, y: 0, w: 4, h: 1, isResizable: false },
        { i: 'clientList', x: 0, y: 1, w: 3, h: 4, minW: 2, minH: 3 },
        { i: 'signups', x: 3, y: 1, w: 1, h: 2, minH: 2 },
        { i: 'endingSoon', x: 3, y: 3, w: 1, h: 2, minH: 2 },
        { i: 'growthChart', x: 0, y: 5, w: 2, h: 2 },
        { i: 'planChart', x: 2, y: 5, w: 2, h: 2 },
    ],
};

const sanitizeLayout = (layout) => {
    return layout.map(item => {
        const sanitizedItem = { i: item.i, x: item.x, y: item.y, w: item.w, h: item.h };
        const validKeys = ['minW', 'maxW', 'minH', 'maxH', 'static', 'isDraggable', 'isResizable'];
        validKeys.forEach(key => {
            if (item[key] !== undefined) {
                sanitizedItem[key] = item[key];
            }
        });
        return sanitizedItem;
    });
};

// --- UPDATED: Added setActiveView to props ---
const SuperAdminDashboard = ({ onSelectClient: propOnSelectClient, setActiveView }) => {
    const [layouts, setLayouts] = useState(null);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isAddClientModalOpen, setAddClientModalOpen] = useState(false);

    // This data fetch is kept for other widgets that might need the full client list
    useEffect(() => {
        const q = query(collection(db, "users"), where("role", "==", "owner"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClients(clientsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching clients: ", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const loadLayout = async () => {
            if (auth.currentUser) {
                const layoutDocRef = doc(db, 'users', auth.currentUser.uid, 'configs', 'dashboardLayout');
                const docSnap = await getDoc(layoutDocRef);
                setLayouts(docSnap.exists() && docSnap.data().lg ? docSnap.data() : defaultLayouts);
            }
        };
        loadLayout();
    }, []);

    const saveLayoutToFirestore = useCallback(
        debounce((newLayouts) => {
            if (auth.currentUser && newLayouts.lg) {
                const sanitizedLayouts = { lg: sanitizeLayout(newLayouts.lg) };
                const layoutDocRef = doc(db, 'users', auth.currentUser.uid, 'configs', 'dashboardLayout');
                setDoc(layoutDocRef, sanitizedLayouts, { merge: true });
            }
        }, 1000),
        []
    );

    const onLayoutChange = (layout, newLayouts) => {
        setLayouts(newLayouts);
        saveLayoutToFirestore(newLayouts);
    };
    
    const handleCloseAddClientModal = () => setAddClientModalOpen(false);
    const handleSelectClient = propOnSelectClient || setSelectedClient;

    if (selectedClient) {
        return <ClientDetailView client={selectedClient} onBack={() => setSelectedClient(null)} />;
    }

    if (!layouts) {
        return <div className="text-center p-8">Loading Dashboard...</div>;
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Super Admin Dashboard</h1>
            
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                onLayoutChange={onLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
                rowHeight={100}
                draggableHandle=".drag-handle"
            >
                <div key="metrics">
                    <DashboardMetrics clients={clients} />
                </div>
                
                {/* --- UPDATED: Replaced ClientListView with ClientListWidget --- */}
                <div key="clientList">
                    <DashboardWidget title="Recent Clients">
                        <ClientListWidget 
                            onSelectClient={handleSelectClient}
                            onViewAll={() => setActiveView('adminClients')}
                        />
                    </DashboardWidget>
                </div>

                <div key="growthChart">
                    <DashboardWidget title="Customer Growth">
                        <CustomerGrowthChart clients={clients} />
                    </DashboardWidget>
                </div>
                
                <div key="planChart">
                    <DashboardWidget title="Revenue By Plan">
                        <RevenueByPlanChart clients={clients} />
                    </DashboardWidget>
                </div>
                
                <div key="signups">
                    <DashboardWidget title="New Signups">
                        <NewSignupsPanel clients={clients} />
                    </DashboardWidget>
                </div>

                <div key="endingSoon">
                    <DashboardWidget title="Subscriptions Ending Soon">
                        <SubscriptionsEndingSoon clients={clients} />
                    </DashboardWidget>
                </div>
            </ResponsiveGridLayout>

            <AddClientModal 
                isOpen={isAddClientModalOpen} 
                onClose={handleCloseAddClientModal} 
            />
        </div>
    );
};

export default SuperAdminDashboard;