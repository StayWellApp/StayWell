import React, { useState, useEffect } from 'react';
import { Building, DollarSign, Users, FileText, Mail, Phone, Edit, Save, X, Briefcase, Hash, RefreshCw, User as UserIcon, TrendingUp, Target, Briefcase as BriefcaseIcon } from 'lucide-react';

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


// --- START: NEW KEY METRICS OPTIONS ---

// --- OPTION 1: Modern Stat Cards (Default) ---
const KeyMetricsCards = ({ properties, clientData, monthlyRevenue, occupancyRate }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <CardContent className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mr-4">
                    <Building className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Properties</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{properties.length}</p>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50 mr-4">
                    <BriefcaseIcon className="h-6 w-6 text-green-500 dark:text-green-400" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{clientData.subscription?.planName || 'N/A'}</p>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/50 mr-4">
                    <DollarSign className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${monthlyRevenue}</p>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="flex items-center">
                <div className="p-3 rounded-full bg-sky-100 dark:bg-sky-900/50 mr-4">
                    <TrendingUp className="h-6 w-6 text-sky-500 dark:text-sky-400" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Occupancy</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{occupancyRate}%</p>
                </div>
            </CardContent>
        </Card>
    </div>
);


// --- OPTION 2: Compact List ---
const KeyMetricsList = ({ properties, clientData, monthlyRevenue, occupancyRate }) => {
    const metrics = [
        { icon: Building, label: "Properties", value: properties.length },
        { icon: BriefcaseIcon, label: "Current Plan", value: clientData.subscription?.planName || 'N/A' },
        { icon: DollarSign, label: "Monthly Revenue", value: `$${monthlyRevenue}` },
        { icon: TrendingUp, label: "Occupancy", value: `${occupancyRate}%` },
    ];

    return (
        <Card>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {metrics.map((metric, index) => (
                    <div key={index} className="p-4 flex justify-between items-center">
                        <div className="flex items-center">
                            <metric.icon className="h-5 w-5 text-gray-400 mr-4" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.label}</span>
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{metric.value}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};


// --- OPTION 3: Bold & Visual ---
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

const KeyMetricsVisual = ({ properties, clientData, monthlyRevenue, occupancyRate }) => (
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{clientData.subscription?.planName || 'N/A'}</p>
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

// --- END: NEW KEY METRICS OPTIONS ---


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
            
            {/* --- HOW TO SWITCH DESIGNS --- */}
            {/* Keep the one you want and comment out the others */}
            
            {/* Option 1: Modern Stat Cards (Default) */}
            <KeyMetricsCards properties={properties} clientData={clientData} monthlyRevenue={monthlyRevenue} occupancyRate={occupancyRate} />
            
            {/* Option 2: Compact List */}
            {/* <KeyMetricsList properties={properties} clientData={clientData} monthlyRevenue={monthlyRevenue} occupancyRate={occupancyRate} /> */}
            
            {/* Option 3: Bold & Visual */}
            {/* <KeyMetricsVisual properties={properties} clientData={clientData} monthlyRevenue={monthlyRevenue} occupancyRate={occupancyRate} /> */}


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