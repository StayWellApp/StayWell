import React, { useState, useEffect } from 'react';
import { Building, DollarSign, Users, FileText, Mail, Phone, Edit, Save, X, Briefcase, Hash, RefreshCw, User as UserIcon, Briefcase as BriefcaseIcon } from 'lucide-react';

// A generic card component for consistent styling
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden ${className}`}>
        {children}
    </div>
);

const CardHeader = ({ title, icon: Icon, action }) => (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
            <Icon className="h-5 w-5 text-gray-400 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {action}
    </div>
);

const CardContent = ({ children, className = '' }) => (
    <div className={`p-4 ${className}`}>
        {children}
    </div>
);

// --- START: Key Metrics Component (Option 3) ---
const ProgressCircle = ({ percentage }) => {
    const radius = 30;
    const stroke = 5;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
            <circle
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="stroke-current text-gray-200 dark:text-gray-700"
                fill="transparent"
            />
            <circle
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="stroke-current text-indigo-500"
                fill="transparent"
            />
        </svg>
    );
};

const KeyMetrics = ({ properties, clientData, monthlyRevenue, occupancyRate }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
            <CardContent>
                <Building className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{properties.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Properties</p>
            </CardContent>
        </Card>
        <Card className="text-center">
            <CardContent>
                <BriefcaseIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white pt-2">{clientData.subscription?.planName || 'N/A'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
            </CardContent>
        </Card>
        <Card className="text-center">
            <CardContent>
                <DollarSign className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-4xl font-bold text-gray-900 dark:text-white">${monthlyRevenue}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</p>
            </CardContent>
        </Card>
        <Card className="relative text-center">
            <CardContent>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <ProgressCircle percentage={occupancyRate} />
                </div>
                <p className="text-4xl font-bold text-gray-900 dark:text-white">{occupancyRate}<span className="text-2xl">%</span></p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Occupancy</p>
            </CardContent>
        </Card>
    </div>
);

// --- END: Key Metrics Component ---


const ContactInfoCard = ({ clientData }) => (
    <Card>
        <CardHeader title="Contact Information" icon={Users} />
        <CardContent className="space-y-3">
            <div className="flex items-center text-sm">
                <UserIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-semibold">{clientData.fullName || 'N/A'}</span>
            </div>
            <div className="flex items-start text-sm">
                <Mail className="h-4 w-4 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                <a href={`mailto:${clientData.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline break-all">{clientData.email}</a>
            </div>
            <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{clientData.phone || 'N/A'}</span>
            </div>
            <div className="flex items-start text-sm">
                <Briefcase className="h-4 w-4 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{clientData.billingAddress || 'N/A'}</span>
            </div>
             <div className="flex items-center text-sm">
                <Hash className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">VAT: {clientData.vatNumber || 'N/A'}</span>
            </div>
             <div className="flex items-center text-sm">
                <Building className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{clientData.country || 'N/A'}</span>
            </div>
        </CardContent>
    </Card>
);

const AdminNotesCard = ({ initialNotes = '', onUpdateNotes }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [notes, setNotes] = useState(initialNotes);

    useEffect(() => {
        setNotes(initialNotes);
    }, [initialNotes]);

    const handleSave = () => {
        onUpdateNotes(notes);
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setNotes(initialNotes);
        setIsEditing(false);
    };

    return (
        <Card>
            <CardHeader 
                title="Admin Notes" 
                icon={FileText} 
                action={!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                )}
            />
            <CardContent>
                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full h-32 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div className="flex justify-end space-x-2">
                            <button onClick={handleCancel} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                            <button onClick={handleSave} className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                <Save className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap h-32 overflow-y-auto">
                        {notes || <span className="text-gray-400">No notes yet. Click edit to add one.</span>}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

const SubscriptionCard = ({ clientData, monthlyRevenue }) => (
    <Card>
        <CardHeader title="Subscription" icon={DollarSign} action={<a href="#" className="text-sm text-indigo-600 hover:underline">Manage</a>} />
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

const RecentActivityCard = () => {
    // This is placeholder data. In the future, this would come from your database.
    const activity = [
        { id: 1, type: 'property_add', description: 'Added "Sunset Villa"', timestamp: '2 hours ago' },
        { id: 2, type: 'subscription', description: 'Upgraded to Pro Plan', timestamp: '1 day ago' },
        { id: 3, type: 'user_invite', description: 'Invited a new team member', timestamp: '3 days ago' },
        { id: 4, type: 'property_update', description: 'Updated photos for "Beach House"', timestamp: '5 days ago' },
    ];

    return (
        <Card>
            <CardHeader title="Recent Activity" icon={RefreshCw} />
            <CardContent>
                <ul className="space-y-3">
                    {activity.map(item => (
                        <li key={item.id} className="flex items-center text-sm">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                                <Building className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="flex-grow">
                                <p className="text-gray-800 dark:text-gray-200">{item.description}</p>
                                <p className="text-xs text-gray-400">{item.timestamp}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
};


const OverviewTab = ({ clientData, properties, monthlyRevenue, occupancyRate, onUpdateNotes }) => {
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
                    <SubscriptionCard clientData={clientData} monthlyRevenue={monthlyRevenue} />
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;