// src/components/admin/ClientDetailView.js

import React, { useState } from 'react';
import { ArrowLeft, User, Building, FileText, BarChart2, Bell, Settings, MessageSquare, DollarSign } from 'lucide-react';
import OverviewTab from './tabs/OverviewTab';
import PropertiesTab from './tabs/PropertiesTab';
import ManagementTab from './tabs/ManagementTab';
import CommunicationTab from './tabs/CommunicationTab';
import BillingTab from './tabs/BillingTab';
// Make sure you have these tab components created in the /tabs/ directory
// import DocumentsTab from './tabs/DocumentsTab';
// import ClientAnalyticsView from './tabs/ClientAnalyticsView';


const ClientDetailView = ({ client, onBack, onSelectProperty }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'management', label: 'Management', icon: Settings },
    { id: 'billing', label: 'Billing & Subscriptions', icon: DollarSign },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    // { id: 'documents', label: 'Documents', icon: FileText },
    // { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab client={client} />;
      case 'properties':
        return <PropertiesTab client={client} onSelectProperty={onSelectProperty} />;
      case 'management':
        return <ManagementTab client={client} />;
       case 'billing':
        return <BillingTab client={client} />;
       case 'communication':
         return <CommunicationTab client={client} />;
    //   case 'documents':
    //     return <DocumentsTab client={client} />;
    //   case 'analytics':
    //     return <ClientAnalyticsView client={client} />;
      default:
        return <OverviewTab client={client} />;
    }
  };

  if (!client) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Client not found.</h2>
        <button onClick={onBack} className="mt-4 flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Client List
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className='flex items-center space-x-4'>
                    <button onClick={onBack} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 mr-4">
                            {client.companyName ? client.companyName.charAt(0) : '?'}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{client.companyName}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Add action buttons here, e.g., Edit, Impersonate */}
                </div>
            </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                        activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                    <tab.icon className="mr-2 h-5 w-5" />
                    {tab.label}
                </button>
            ))}
            </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-grow p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {renderTabContent()}
        </div>
    </div>
  );
};

export default ClientDetailView;