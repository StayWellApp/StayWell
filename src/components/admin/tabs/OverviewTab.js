import React, { useState, useEffect } from 'react';
import { Building, DollarSign, Users, FileText, Mail, Phone, Edit, Save, X, Briefcase, Hash, RefreshCw, User as UserIcon, Briefcase as BriefcaseIcon } from 'lucide-react';

// Card components...
const Card = ({ children, className = '' }) => <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden ${className}`}>{children}</div>;
const CardHeader = ({ title, icon: Icon, action }) => ( /* ... */ );
const CardContent = ({ children, className = '' }) => <div className={`p-4 ${className}`}>{children}</div>;

// --- FIX: Corrected ProgressCircle component ---
const ProgressCircle = ({ percentage }) => {
    const radius = 35;
    const stroke = 6;
    const normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative h-20 w-20">
            <svg height="100%" width="100%" viewBox="0 0 80 80" className="transform -rotate-90">
                <circle
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius + 5}
                    cy={radius + 5}
                    className="stroke-current text-gray-200 dark:text-gray-700"
                    fill="transparent"
                />
                <circle
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset }}
                    r={normalizedRadius}
                    cx={radius + 5}
                    cy={radius + 5}
                    className="stroke-current text-indigo-500 transition-all duration-500 ease-in-out"
                    fill="transparent"
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xl font-bold text-gray-900 dark:text-white">{percentage}<span className="text-sm">%</span></p>
            </div>
        </div>
    );
};

const KeyMetrics = ({ properties, clientData, monthlyRevenue, occupancyRate }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center p-4">
            <Building className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{properties.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Properties</p>
        </Card>
        <Card className="text-center p-4">
            <BriefcaseIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white pt-2">{clientData.subscription?.planName || 'N/A'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
        </Card>
        <Card className="text-center p-4">
            <DollarSign className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-4xl font-bold text-gray-900 dark:text-white">${monthlyRevenue}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</p>
        </Card>
        <Card className="flex flex-col items-center justify-center p-4">
            <ProgressCircle percentage={occupancyRate} />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Occupancy</p>
        </Card>
    </div>
);


// --- FIX: SubscriptionCard now accepts setActiveTab ---
const SubscriptionCard = ({ clientData, monthlyRevenue, setActiveTab }) => (
    <Card>
        <CardHeader 
            title="Subscription" 
            icon={DollarSign} 
            action={
                <button onClick={() => setActiveTab('management')} className="text-sm font-medium text-indigo-600 hover:underline">
                    Manage
                </button>
            } 
        />
        <CardContent className="space-y-3">
             <div className="flex justify-between items-center text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-300">Plan</p>
                <p className="font-semibold text-gray-900 dark:text-white">{clientData.subscription?.planName || 'N/A'}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-300">Monthly Rate</p>
                <p className="font-semibold text-gray-900 dark:text-white">${monthlyRevenue}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-300">Start Date</p>
                <p className="text-gray-900 dark:text-white">
                    {clientData.subscription?.assignedAt?.seconds ? new Date(clientData.subscription.assignedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </p>
            </div>
            <div className="flex justify-between items-center text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-300">Next Billing</p>
                <p className="text-gray-900 dark:text-white">
                    {clientData.subscription?.renewalDate?.seconds ? new Date(clientData.subscription.renewalDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                </p>
            </div>
        </CardContent>
    </Card>
);

// Other cards (ContactInfoCard, AdminNotesCard, RecentActivityCard) remain the same...
const ContactInfoCard = ({ clientData }) => { /* ... */ };
const AdminNotesCard = ({ initialNotes, onUpdateNotes }) => { /* ... */ };
const RecentActivityCard = () => { /* ... */ };


// --- FIX: OverviewTab now accepts and passes down setActiveTab ---
const OverviewTab = ({ clientData, properties, monthlyRevenue, occupancyRate, onUpdateNotes, setActiveTab }) => {
    return (
        <div className="space-y-6">
            <KeyMetrics properties={properties} clientData={clientData} monthlyRevenue={monthlyRevenue} occupancyRate={occupancyRate} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <RecentActivityCard />
                    <AdminNotesCard initialNotes={clientData.adminNotes} onUpdateNotes={onUpdateNotes} />
                </div>
                <div className="space-y-6">
                    <ContactInfoCard clientData={clientData} />
                    <SubscriptionCard clientData={clientData} monthlyRevenue={monthlyRevenue} setActiveTab={setActiveTab} />
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;