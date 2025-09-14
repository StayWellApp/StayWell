// src/components/admin/SuperAdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { db, auth } from '../../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import debounce from 'lodash.debounce';

// Import Widgets
import DashboardWidget from './DashboardWidget';
import ClientListView from './ClientListView';
import ClientDetailView from './ClientDetailView';
import CustomerGrowthChart from './CustomerGrowthChart';
import RevenueByPlanChart from './RevenueByPlanChart';
import NewSignupsPanel from './NewSignupsPanel';
import SubscriptionsEndingSoon from './SubscriptionsEndingSoon';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const defaultLayouts = {
    lg: [
        { i: 'revenue', x: 0, y: 0, w: 1, h: 1 },
        { i: 'newClients', x: 1, y: 0, w: 1, h: 1 },
        { i: 'subscriptions', x: 2, y: 0, w: 1, h: 1 },
        { i: 'signups', x: 3, y: 0, w: 1, h: 2, minH: 2 },
        { i: 'clientList', x: 0, y: 1, w: 3, h: 4, minW: 2, minH: 3 },
        { i: 'growthChart', x: 0, y: 5, w: 2, h: 2 },
        { i: 'planChart', x: 2, y: 5, w: 2, h: 2 },
        { i: 'endingSoon', x: 3, y: 2, w: 1, h: 2, minH: 2 },
    ],
};

const sanitizeLayout = (layout) => {
    const requiredKeys = ['w', 'h', 'x', 'y', 'i', 'minW', 'maxW', 'minH', 'maxH', 'static', 'isDraggable', 'isResizable'];
    return layout.map(item => {
        const sanitizedItem = {};
        for (const key of requiredKeys) {
            if (item[key] !== undefined) {
                sanitizedItem[key] = item[key];
            }
        }
        return sanitizedItem;
    });
};

// --- FIX: Replaced placeholder comments with actual component definitions ---
const TotalRevenueWidget = () => (
    <div className="text-center">
        <h4 className="text-4xl font-bold text-gray-800 dark:text-gray-100">$12,450</h4>
        <p className="text-sm text-green-500">+12% from last month</p>
    </div>
);
const NewClientsWidget = () => (
    <div className="text-center">
        <h4 className="text-4xl font-bold text-gray-800 dark:text-gray-100">8</h4>
        <p className="text-sm text-gray-500">In the last 30 days</p>
    </div>
);
const ActiveSubscriptionsWidget = () => (
    <div className="text-center">
        <h4 className="text-4xl font-bold text-gray-800 dark:text-gray-100">124</h4>
        <p className="text-sm text-gray-500">Across all clients</p>
    </div>
);

const SuperAdminDashboard = () => {
    const [layouts, setLayouts] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);

    useEffect(() => {
        const loadLayout = async () => {
            if (auth.currentUser) {
                const layoutDocRef = doc(db, 'users', auth.currentUser.uid, 'configs', 'dashboardLayout');
                const docSnap = await getDoc(layoutDocRef);
                if (docSnap.exists() && docSnap.data().lg) {
                    setLayouts(docSnap.data());
                } else {
                    setLayouts(defaultLayouts);
                }
            }
        };
        loadLayout();
    }, []);

    const saveLayoutToFirestore = useCallback(debounce((newLayouts) => {
        if (auth.currentUser) {
            const sanitizedLayouts = { lg: sanitizeLayout(newLayouts.lg || []) };
            const layoutDocRef = doc(db, 'users', auth.currentUser.uid, 'configs', 'dashboardLayout');
            setDoc(layoutDocRef, sanitizedLayouts, { merge: true });
        }
    }, 1000), []);

    const onLayoutChange = (layout, newLayouts) => {
        setLayouts(newLayouts);
        saveLayoutToFirestore(newLayouts);
    };
    
    if (selectedClient) {
        return <ClientDetailView client={selectedClient} onBack={() => setSelectedClient(null)} />;
    }

    if (!layouts) {
        return <div className="text-center p-8">Loading Dashboard...</div>;
    }
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Super Admin Dashboard</h1>
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                onLayoutChange={onLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
                rowHeight={150}
                draggableHandle=".drag-handle"
            >
                <div key="revenue"><DashboardWidget title="Total Revenue"><TotalRevenueWidget /></DashboardWidget></div>
                <div key="newClients"><DashboardWidget title="New Clients (30d)"><NewClientsWidget /></DashboardWidget></div>
                <div key="subscriptions"><DashboardWidget title="Active Subscriptions"><ActiveSubscriptionsWidget /></DashboardWidget></div>
                <div key="clientList"><DashboardWidget title="Clients" showDragHandle={false}><ClientListView onSelectClient={setSelectedClient} /></DashboardWidget></div>
                <div key="growthChart"><DashboardWidget title="Customer Growth"><CustomerGrowthChart /></DashboardWidget></div>
                <div key="planChart"><DashboardWidget title="Revenue By Plan"><RevenueByPlanChart /></DashboardWidget></div>
                <div key="signups"><DashboardWidget title="New Signups"><NewSignupsPanel /></DashboardWidget></div>
                <div key="endingSoon"><DashboardWidget title="Subscriptions Ending Soon"><SubscriptionsEndingSoon /></DashboardWidget></div>
            </ResponsiveGridLayout>
        </div>
    );
};

export default SuperAdminDashboard;