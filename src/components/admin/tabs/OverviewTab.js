import React, { useState, useEffect } from 'react';
import { Building, DollarSign, Users, FileText, Mail, Phone, Edit, Save, X, Briefcase, Hash, RefreshCw, User as UserIcon, Briefcase as BriefcaseIcon, CheckCircle, Clock, Edit2, Trash2, PlusCircle, AlertCircle, Info, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Card = ({ children, className = '' }) => (<div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden ${className}`}>{children}</div>);
const CardHeader = ({ title, icon: Icon, action }) => (<div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"><div className="flex items-center"><Icon className="h-5 w-5 text-gray-400 mr-3" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3></div>{action}</div>);
const CardContent = ({ children, className = '' }) => (<div className={`p-4 ${className}`}>{children}</div>);
const ProgressCircle = ({ percentage }) => { /* ... */ return <div/>; };
const KeyMetrics = ({ properties, clientData, monthlyRevenue, occupancyRate }) => ( /* ... */ return <div/>; );
const ContactInfoCard = ({ clientData }) => ( /* ... */ return <Card/>; );
const SubscriptionCard = ({ clientData, monthlyRevenue, setActiveTab }) => ( /* ... */ return <Card/>; );
const getActivityIcon = (logType) => { /* ... */ return <div/>; };
const RecentActivityCard = ({ logs, loading }) => ( /* ... */ return <Card/>; );

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

const AdminNotesCard = ({ initialNotes = [], onAddNote, onDeleteNote }) => {
    const [isAdding, setIsAdding] = useState(false);
    const sortedNotes = Array.isArray(initialNotes) ? [...initialNotes].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) : [];
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
                                    <p className="text-xs text-gray-400 mt-1">by {note.createdBy} • {note.createdAt ? formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true }) : '...'}</p>
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