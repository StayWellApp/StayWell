import React, { useState, useEffect } from 'react';
import { Building, DollarSign, Users, FileText, Mail, Phone, Edit, Save, X, Briefcase, Hash, RefreshCw, User as UserIcon, Briefcase as BriefcaseIcon, CheckCircle, Clock, Edit2, Trash2, PlusCircle, AlertCircle, Info, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Card = ({ children, className = '' }) => (<div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden ${className}`}>{children}</div>);
const CardHeader = ({ title, icon: Icon, action }) => (<div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"><div className="flex items-center"><Icon className="h-5 w-5 text-gray-400 mr-3" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3></div>{action}</div>);
const CardContent = ({ children, className = '' }) => (<div className={`p-4 ${className}`}>{children}</div>);

const ProgressCircle = ({ percentage }) => {
    const radius = 35, stroke = 6, normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (
        <div className="relative h-20 w-20">
            <svg height="100%" width="100%" viewBox="0 0 80 80" className="transform -rotate-90">
                <circle strokeWidth={stroke} r={normalizedRadius} cx={radius + 5} cy={radius + 5} className="stroke-current text-gray-200 dark:text-gray-700" fill="transparent" />
                <circle strokeWidth={stroke} strokeDasharray={`${circumference} ${circumference}`} style={{ strokeDashoffset }} r={normalizedRadius} cx={radius + 5} cy={radius + 5} className="stroke-current text-indigo-500 transition-all duration-500 ease-in-out" fill="transparent" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><p className="text-xl font-bold text-gray-900 dark:text-white">{percentage}<span className="text-sm">%</span></p></div>
        </div>
    );
};

const KeyMetrics = ({ properties, clientData, monthlyRevenue, occupancyRate }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center p-4"><Building className="h-8 w-8 mx-auto text-gray-400 mb-2" /><p className="text-4xl font-bold text-gray-900 dark:text-white">{properties.length}</p><p className="text-sm text-gray-500 dark:text-gray-400">Properties</p></Card>
        <Card className="text-center p-4"><BriefcaseIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" /><p className="text-2xl font-bold text-gray-900 dark:text-white pt-2">{clientData.subscription?.planName || 'N/A'}</p><p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p></Card>
        <Card className="text-center p-4"><DollarSign className="h-8 w-8 mx-auto text-gray-400 mb-2" /><p className="text-4xl font-bold text-gray-900 dark:text-white">${monthlyRevenue}</p><p className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</p></Card>
        <Card className="flex flex-col items-center justify-center p-4"><ProgressCircle percentage={occupancyRate} /><p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Occupancy</p></Card>
    </div>
);

const ContactInfoCard = ({ clientData }) => (
    <Card>
        <CardHeader title="Contact Information" icon={Users} />
        <CardContent className="space-y-3">
            <div className="flex items-center text-sm"><UserIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300 font-semibold">{clientData.fullName || 'N/A'}</span></div>
            <div className="flex items-start text-sm"><Mail className="h-4 w-4 text-gray-400 mr-3 mt-1 flex-shrink-0" /><a href={`mailto:${clientData.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline break-all">{clientData.email}</a></div>
            <div className="flex items-center text-sm"><Phone className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{clientData.phone || 'N/A'}</span></div>
            <div className="flex items-start text-sm"><Briefcase className="h-4 w-4 text-gray-400 mr-3 mt-1 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{clientData.billingAddress || 'N/A'}</span></div>
            <div className="flex items-center text-sm"><Hash className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">VAT: {clientData.vatNumber || 'N/A'}</span></div>
            <div className="flex items-center text-sm"><Building className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{clientData.country || 'N/A'}</span></div>
        </CardContent>
    </Card>
);

const AddNoteForm = ({ onAddNote, onCancel }) => {
    const [text, setText] = useState('');
    const [importance, setImportance] = useState('medium');
    const handleSubmit = (e) => { e.preventDefault(); onAddNote({ text, importance }); };
    const importanceLevels = [ { id: 'high', label: 'High', color: 'text-red-500' }, { id: 'medium', label: 'Medium', color: 'text-yellow-500' }, { id: 'low', label: 'Low', color: 'text-blue-500' }];
    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-900/50">
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a new note..." className="w-full h-24 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" required />
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Importance:</span>
                    {importanceLevels.map(level => (
                        <label key={level.id} className="flex items-center space-x-1 cursor-pointer">
                            <input type="radio" name="importance" value={level.id} checked={importance === level.id} onChange={() => setImportance(level.id)} className={`form-radio h-4 w-4 ${level.color} focus:ring-indigo-500 border-gray-300`} />
                            <span className={`text-sm ${level.color}`}>{level.label}</span>
                        </label>
                    ))}
                </div>
                <div className="flex items-center space-x-2">
                    <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 border">Cancel</button>
                    <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save Note</button>
                </div>
            </div>
        </form>
    );
};

const getImportanceIcon = (level) => {
    switch (level) {
        case 'high': return <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
        case 'medium': return <Flag className="h-5 w-5 text-yellow-500 flex-shrink-0" />;
        case 'low': return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
        default: return <Info className="h-5 w-5 text-gray-400 flex-shrink-0" />;
    }
};

// --- THIS IS THE FIX ---
const formatTimestamp = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    }
    return 'a few moments ago';
};

const AdminNotesCard = ({ initialNotes = [], onAddNote, onDeleteNote }) => {
    const [isAdding, setIsAdding] = useState(false);
    
    const sortedNotes = Array.isArray(initialNotes)
        ? [...initialNotes].sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return dateB - dateA;
          })
        : [];

    const handleAdd = (note) => { onAddNote(note); setIsAdding(false); };

    return (
        <Card>
            <CardHeader title="Admin Notes" icon={FileText} action={!isAdding && (<button onClick={() => setIsAdding(true)} className="flex items-center px-2 py-1 text-sm text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900"><PlusCircle className="h-4 w-4 mr-1" />Add Note</button>)} />
            {isAdding && <AddNoteForm onAddNote={handleAdd} onCancel={() => setIsAdding(false)} />}
            <CardContent>
                {sortedNotes.length > 0 ? (
                    <ul className="space-y-4 max-h-96 overflow-y-auto">
                        {sortedNotes.map(note => (
                            <li key={note.id} className="flex items-start space-x-3 group">
                                <div>{getImportanceIcon(note.importance)}</div>
                                <div className="flex-grow">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.text}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        by {note.createdBy} • {formatTimestamp(note.createdAt)}
                                    </p>
                                </div>
                                <button onClick={() => onDeleteNote(note)} className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-opacity"><Trash2 className="h-4 w-4 text-red-500" /></button>
                            </li>
                        ))}
                    </ul>
                ) : (<div className="text-center text-gray-400 py-8">No notes yet. Click "Add Note" to start.</div>)}
            </CardContent>
        </Card>
    );
};

const SubscriptionCard = ({ clientData, monthlyRevenue, setActiveTab }) => (
    <Card>
        <CardHeader title="Subscription" icon={DollarSign} action={<button onClick={() => setActiveTab('management')} className="text-sm font-medium text-indigo-600 hover:underline">Manage</button>} />
        <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm"><p className="font-medium text-gray-700 dark:text-gray-300">Plan</p><p className="font-semibold text-gray-900 dark:text-white">{clientData.subscription?.planName || 'N/A'}</p></div>
            <div className="flex justify-between items-center text-sm"><p className="font-medium text-gray-700 dark:text-gray-300">Monthly Rate</p><p className="font-semibold text-gray-900 dark:text-white">${monthlyRevenue}</p></div>
            <div className="flex justify-between items-center text-sm"><p className="font-medium text-gray-700 dark:text-gray-300">Start Date</p><p className="text-gray-900 dark:text-white">{clientData.subscription?.assignedAt?.seconds ? new Date(clientData.subscription.assignedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p></div>
            <div className="flex justify-between items-center text-sm"><p className="font-medium text-gray-700 dark:text-gray-300">Next Billing</p><p className="font-semibold text-gray-900 dark:text-white">{clientData.subscription?.renewalDate?.seconds ? new Date(clientData.subscription.renewalDate.seconds * 1000).toLocaleDateString() : 'N/A'}</p></div>
        </CardContent>
    </Card>
);

const getActivityIcon = (logType) => {
    switch(logType) {
        case 'USER_CREATED': return <UserIcon className="h-4 w-4 text-green-500" />;
        case 'SUBSCRIPTION_UPDATED': return <RefreshCw className="h-4 w-4 text-blue-500" />;
        case 'PROPERTY_ADDED': return <Building className="h-4 w-4 text-indigo-500" />;
        case 'STATUS_CHANGED': return <CheckCircle className="h-4 w-4 text-yellow-500" />;
        case 'PROPERTY_UPDATED': return <Edit2 className="h-4 w-4 text-purple-500" />;
        case 'PROPERTY_DELETED': return <Trash2 className="h-4 w-4 text-red-500" />;
        default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
};

const RecentActivityCard = ({ logs, loading }) => (
    <Card>
        <CardHeader title="Recent Activity" icon={RefreshCw} />
        <CardContent>
            {loading ? <div className="text-center text-gray-500">Loading activity...</div> : logs.length === 0 ? <div className="text-center text-gray-500">No recent activity found.</div> :
                <ul className="space-y-4 max-h-96 overflow-y-auto">
                    {logs.map(log => (
                        <li key={log.id} className="flex items-start text-sm">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-8 w-8 flex items-center justify-center mr-3 flex-shrink-0">{getActivityIcon(log.type)}</div>
                            <div className="flex-grow">
                                <p className="text-gray-800 dark:text-gray-200">{log.description}</p>
                                <p className="text-xs text-gray-400">
                                    {formatTimestamp(log.timestamp)}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            }
        </CardContent>
    </Card>
);

const OverviewTab = ({ clientData, properties, monthlyRevenue, occupancyRate, onAddNote, onDeleteNote, setActiveTab, activityLogs, loadingLogs }) => (
    <div className="space-y-6">
        <KeyMetrics properties={properties} clientData={clientData} monthlyRevenue={monthlyRevenue} occupancyRate={occupancyRate} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <RecentActivityCard logs={activityLogs} loading={loadingLogs} />
                <AdminNotesCard initialNotes={clientData.adminNotes} onAddNote={onAddNote} onDeleteNote={onDeleteNote} />
            </div>
            <div className="space-y-6">
                <ContactInfoCard clientData={clientData} />
                <SubscriptionCard clientData={clientData} monthlyRevenue={monthlyRevenue} setActiveTab={setActiveTab} />
            </div>
        </div>
    </div>
);

export default OverviewTab;