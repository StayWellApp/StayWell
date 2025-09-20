// src/components/admin/tabs/CommunicationTab.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { PlusIcon, PhoneIcon, EnvelopeIcon, UserGroupIcon as MeetingIcon } from '@heroicons/react/24/outline';

const CommunicationTab = () => {
    const [logs, setLogs] = useState([
        { id: 1, type: 'Email', subject: 'Onboarding complete', notes: 'Sent the welcome packet and initial setup guide.', date: '2025-09-18' },
        { id: 2, type: 'Call', subject: 'Follow-up call', notes: 'Discussed first property listing. Client is happy with the progress.', date: '2025-09-20' },
    ]);
    const [newLog, setNewLog] = useState({ type: 'Call', subject: '', notes: '' });

    const handleAddLog = (e) => {
        e.preventDefault();
        if (!newLog.subject || !newLog.notes) {
            toast.error("Please fill out both subject and notes.");
            return;
        }
        const newEntry = {
            id: logs.length + 1,
            ...newLog,
            date: new Date().toLocaleDateString('en-CA')
        };
        setLogs([newEntry, ...logs]);
        setNewLog({ type: 'Call', subject: '', notes: '' });
        toast.success("Communication logged successfully!");
    };
    
    const communicationIcons = {
        'Call': <PhoneIcon className="h-6 w-6 text-blue-500" />,
        'Email': <EnvelopeIcon className="h-6 w-6 text-green-500" />,
        'Meeting': <MeetingIcon className="h-6 w-6 text-purple-500" />,
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4">Log New Communication</h3>
                    <form onSubmit={handleAddLog} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select value={newLog.type} onChange={(e) => setNewLog({ ...newLog, type: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option>Call</option>
                                <option>Email</option>
                                <option>Meeting</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <input type="text" value={newLog.subject} onChange={(e) => setNewLog({ ...newLog, subject: e.target.value })} placeholder="e.g., Follow-up call" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea value={newLog.notes} onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })} rows="4" placeholder="Add notes..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                        </div>
                        <button type="submit" className="button-primary w-full flex items-center justify-center gap-2">
                            <PlusIcon className="w-5 h-5"/> Log Communication
                        </button>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4">Communication History</h3>
                    <div className="space-y-6">
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-4">
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-12 w-12 flex-shrink-0 flex items-center justify-center">
                                    {communicationIcons[log.type]}
                                </div>
                                <div>
                                    <p className="font-bold">{log.subject} <span className="text-sm font-normal text-gray-500 ml-2">{log.date}</span></p>
                                    <p className="text-gray-600 dark:text-gray-400">{log.notes}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunicationTab;