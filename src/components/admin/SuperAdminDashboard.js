import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Settings, Move } from 'lucide-react';

// Import all your widget components
import DashboardMetrics from './DashboardMetrics';
import ClientListWidget from './ClientListWidget';
import SubscriptionsEndingSoon from './SubscriptionsEndingSoon';
import NewSignupsPanel from './NewSignupsPanel';
import RevenueByPlanChart from './RevenueByPlanChart';
import ManageWidgetsModal from './ManageWidgetsModal';
import CustomerGrowthChart from './CustomerGrowthChart';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Define all possible widgets with names and default layouts
const ALL_WIDGETS = {
    'metrics': { component: DashboardMetrics, name: 'Key Metrics', defaultLayout: { w: 12, h: 1 } },
    'clients': { component: ClientListWidget, name: 'Clients', defaultLayout: { w: 6, h: 4 } },
    'newSignups': { component: NewSignupsPanel, name: 'Recent Signups', defaultLayout: { w: 3, h: 4 } },
    'endingSoon': { component: SubscriptionsEndingSoon, name: 'Subscriptions Ending Soon', defaultLayout: { w: 3, h: 4 } },
    'growthChart': { component: CustomerGrowthChart, name: 'Customer Growth', defaultLayout: { w: 8, h: 4 } },
    'revenueChart': { component: RevenueByPlanChart, name: 'Revenue By Plan', defaultLayout: { w: 4, h: 4 } },
};

const SuperAdminDashboard = ({ allClients, loading, setActiveView, onSelectClient }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    
    // Load layouts and visible widgets from localStorage, with a fallback to default
    const [layouts, setLayouts] = useState(() => {
        try {
            const saved = localStorage.getItem('dashboardLayouts_v2');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });
    
    const [visibleWidgets, setVisibleWidgets] = useState(() => {
        try {
            const saved = localStorage.getItem('visibleWidgets_v2');
            return saved ? JSON.parse(saved) : Object.keys(ALL_WIDGETS);
        } catch { return Object.keys(ALL_WIDGETS); }
    });

    useEffect(() => {
        localStorage.setItem('dashboardLayouts_v2', JSON.stringify(layouts));
        localStorage.setItem('visibleWidgets_v2', JSON.stringify(visibleWidgets));
    }, [layouts, visibleWidgets]);

    const onLayoutChange = (layout, newLayouts) => {
        setLayouts(newLayouts);
    };

    const handleWidgetToggle = (widgetKey) => {
        setVisibleWidgets(prev => 
            prev.includes(widgetKey) ? prev.filter(k => k !== widgetKey) : [...prev, widgetKey]
        );
    };
    
    const generateLayout = () => {
        const layout = visibleWidgets.map((key, index) => {
            const defaultL = ALL_WIDGETS[key].defaultLayout;
            return {
                i: key,
                x: (index * 4) % 12,
                y: Math.floor(index / 3) * 4,
                ...defaultL
            };
        });
        return { lg: layout };
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
                    className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Settings className="h-4 w-4 mr-2" /> Manage Widgets
                </button>
            </div>
            
            <ResponsiveGridLayout
                layouts={layouts.lg ? layouts : generateLayout()}
                onLayoutChange={onLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
                rowHeight={100}
                draggableHandle=".drag-handle"
                isDraggable={true}
                isResizable={true}
            >
                {visibleWidgets.map(key => {
                    const WidgetComponent = ALL_WIDGETS[key].component;
                    return (
                        <div key={key} className="relative group bg-transparent p-2">
                           <div className="h-full w-full">
                                <div className="drag-handle cursor-move absolute top-3 left-3 z-10 p-2 opacity-0 group-hover:opacity-50 transition-opacity bg-white/50 dark:bg-black/50 rounded-full">
                                    <Move size={16} />
                                </div>
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