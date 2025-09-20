// src/components/admin/tabs/OverviewTab.js
// Implemented a customizable, draggable, and resizable grid layout.

import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { BriefcaseIcon, UserGroupIcon, TagIcon } from '@heroicons/react/24/outline';

const ResponsiveGridLayout = WidthProvider(Responsive);

const OverviewTab = ({ clientData, properties, loadingProperties, planDetails, monthlyRevenue, occupancyRate, onUpdateNotes }) => {
    
    const formatDate = (timestamp) => {
        return timestamp?.toDate ? timestamp.toDate().toLocaleDateString() : 'N/A';
    };

    // Define the initial layout of the widgets
    const initialLayout = [
        { i: 'portfolio', x: 0, y: 0, w: 8, h: 2 },
        { i: 'profile', x: 8, y: 0, w: 4, h: 2 },
        { i: 'subscription', x: 8, y: 2, w: 4, h: 2 },
        { i: 'notes', x: 8, y: 4, w: 4, h: 2 },
    ];

    const [layout, setLayout] = useState(initialLayout);

    // This function is called when the layout changes, so you can save it.
    const onLayoutChange = (newLayout) => {
        // In a real app, you might save this `newLayout` to localStorage or a user profile in your database.
        setLayout(newLayout);
    };

    return (
        <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            onLayoutChange={onLayoutChange}
        >
            <div key="portfolio" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
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

            <div key="profile" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-3"><UserGroupIcon className="w-6 h-6 text-gray-500"/>Client Profile</h3>
                <div className="space-y-3 text-sm">
                    <div><strong>Company:</strong> {clientData.companyName || 'N/A'}</div>
                    <div><strong>Contact:</strong> {clientData.name}</div>
                    <div><strong>Email:</strong> {clientData.email}</div>
                    <div><strong>Member Since:</strong> {formatDate(clientData.createdAt)}</div>
                </div>
            </div>

            <div key="subscription" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-3"><TagIcon className="w-6 h-6 text-gray-500"/>Subscription</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Plan:</span> <span className="font-medium">{planDetails?.planName || 'Not Subscribed'}</span></div>
                    <div className="flex justify-between"><span>Status:</span> <span className={`font-semibold ${clientData.subscription?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{clientData.subscription?.status || 'N/A'}</span></div>
                    <div className="flex justify-between"><span>Start Date:</span> <span className="font-medium">{formatDate(clientData.subscription?.startDate)}</span></div>
                    <div className="pt-3 mt-3 border-t dark:border-gray-600 flex justify-between">
                        <strong>Monthly Revenue:</strong> 
                        <span className="font-bold text-blue-600">${monthlyRevenue.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
             <div key="notes" className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Admin Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Important client notes go here.</p>
                {/* Note functionality would be added back here */}
            </div>
        </ResponsiveGridLayout>
    );
};

export default OverviewTab;