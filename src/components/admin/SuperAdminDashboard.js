import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Settings, Plus } from 'lucide-react';

// Import all your widget components
import DashboardMetrics from './DashboardMetrics';
import ClientListWidget from './ClientListWidget';
import SubscriptionsEndingSoon from './SubscriptionsEndingSoon';
import NewSignupsPanel from './NewSignupsPanel';
import RevenueByPlanChart from './RevenueByPlanChart';
import ManageWidgetsModal from './ManageWidgetsModal';
import CustomerGrowthChart from './CustomerGrowthChart'; // Assuming you have this component

const ResponsiveGridLayout = WidthProvider(Responsive);

// Define all possible widgets
const ALL_WIDGETS = {
    'metrics': { component: DashboardMetrics, name: 'Key Metrics' },
    'clients': { component: ClientListWidget, name: 'Clients' },
    'endingSoon': { component: SubscriptionsEndingSoon, name: 'Subscriptions Ending Soon' },
    'newSignups': { component: NewSignupsPanel, name: 'New Signups' },
    'revenueChart': { component: RevenueByPlanChart, name: 'Revenue By Plan' },
    'growthChart': { component: CustomerGrowthChart, name: 'Customer Growth' },
};

const SuperAdminDashboard = ({ allClients, loading, setActiveView, onSelectClient }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    
    // Default layout
    const initialLayouts = {
        lg: [
            { i: 'metrics', x: 0, y: 0, w: 12, h: 1 },
            { i: 'clients', x: 0, y: 1, w: 6, h: 4 },
            { i: 'newSignups', x: 6, y: 1, w: 3, h: 4 },
            { i: 'endingSoon', x: 9, y: 1, w: 3, h: 4 },
            { i: 'growthChart', x: 0, y: 5, w: 8, h: 4 },
            { i: 'revenueChart', x: 8, y: 5, w: 4, h: 4 },
        ],
    };

    const [layouts, setLayouts] = useState(() => {
        try {
            const savedLayouts = localStorage.getItem('dashboardLayouts');
            return savedLayouts ? JSON.parse(savedLayouts) : initialLayouts;
        } catch (e) {
            return initialLayouts;
        }
    });
    
    const [visibleWidgets, setVisibleWidgets] = useState(() => {
         try {
            const savedWidgets = localStorage.getItem('visibleWidgets');
            return savedWidgets ? JSON.parse(savedWidgets) : ['metrics', 'clients', 'newSignups', 'endingSoon', 'growthChart', 'revenueChart'];
        } catch (e) {
            return ['metrics', 'clients', 'newSignups', 'endingSoon', 'growthChart', 'revenueChart'];
        }
    });

    useEffect(() => {
        localStorage.setItem('dashboardLayouts', JSON.stringify(layouts));
        localStorage.setItem('visibleWidgets', JSON.stringify(visibleWidgets));
    }, [layouts, visibleWidgets]);

    const onLayoutChange = (layout, newLayouts) => {
        setLayouts(newLayouts);
    };

    const handleWidgetToggle = (widgetKey) => {
        setVisibleWidgets(prev => 
            prev.includes(widgetKey) ? prev.filter(k => k !== widgetKey) : [...prev, widgetKey]
        );
    };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, Super Admin!</p>
                </div>
                <button 
                    onClick={() => setModalOpen(true)}
                    className="flex items-center px-3 py-2 bg-white dark:bg-gray-700 border dark:border-gray-600 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                    <Settings className="h-4 w-4 mr-2" /> Manage Widgets
                </button>
            </div>
            
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                onLayoutChange={onLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={100}
                draggableHandle=".drag-handle"
            >
                {visibleWidgets.map(key => {
                    const WidgetComponent = ALL_WIDGETS[key].component;
                    return (
                        <div key={key} className="bg-transparent">
                           <div className="h-full w-full p-2">
                               <div className="drag-handle cursor-move absolute top-0 left-0 p-2 opacity-20 hover:opacity-100 transition-opacity"></div>
                                <WidgetComponent
                                    clients={allClients}
                                    loading={loading}
                                    onSelectClient={onSelectClient}
                                    onViewAll={() => setActiveView('adminClients')}
                                />
                           </div>
                        </div>
                    );
                })}
            </ResponsiveGridLayout>

            <ManageWidgetsModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                widgets={ALL_WIDGETS}
                visibleWidgets={visibleWidgets}
                onWidgetToggle={handleWidgetToggle}
            />
        </div>
    );
};

export default SuperAdminDashboard;