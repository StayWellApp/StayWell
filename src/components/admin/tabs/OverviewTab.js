// src/components/admin/tabs/OverviewTab.js
import React from 'react';
import { BriefcaseIcon, UserGroupIcon, TagIcon } from '@heroicons/react/24/outline';

const OverviewTab = ({ clientData, properties, loadingProperties, planDetails, monthlyRevenue, occupancyRate }) => {
    return (
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
};

export default OverviewTab;