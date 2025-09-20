// src/components/admin/tabs/OverviewTab.js
// Admin Notes section is now fully functional with add/delete and proper styling.

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
    BriefcaseIcon, UserGroupIcon, TagIcon, ClockIcon, 
    CheckCircleIcon, XCircleIcon 
} from '@heroicons/react/24/outline';

const OverviewTab = ({ clientData, properties, loadingProperties, planDetails, monthlyRevenue, occupancyRate, onUpdateNotes }) => {
    
    const [notes, setNotes] = useState(clientData.adminNotes || []);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        setNotes(clientData.adminNotes || []);
    }, [clientData.adminNotes]);

    const handleSaveNote = () => {
        if (newNote.trim() === '') {
            toast.error("Note cannot be empty.");
            return;
        }
        const updatedNotes = [...notes, { text: newNote, date: new Date().toISOString() }];
        onUpdateNotes(updatedNotes); // This function will be passed from ClientDetailView to save to DB
        setNewNote(''); // Clear the textarea
    };

    const handleDeleteNote = (index) => {
        const updatedNotes = notes.filter((_, i) => i !== index);
        onUpdateNotes(updatedNotes); // This function will be passed from ClientDetailView to save to DB
    };

    const formatDate = (timestamp) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString();
        }
        return 'N/A';
    };

    const recentActivity = clientData.recentActivity || [
        { id: 1, type: 'Booking', description: 'New booking for The Seaside Villa', date: '2025-09-22' },
        { id: 2, type: 'Task', description: 'Cleaning for The Grand Cabin completed', date: '2025-09-21' },
    ];

    const activityIcons = {
        'Booking': <BriefcaseIcon className="w-5 h-5 text-blue-600"/>,
        'Task': <CheckCircleIcon className="w-5 h-5 text-green-600"/>,
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-3"><BriefcaseIcon className="w-6 h-6 text-gray-500" />Portfolio Snapshot</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Total Properties</p><p className="text-2xl font-bold">{loadingProperties ? '...' : properties.length}</p></div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Occupancy Rate</p><p className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</p></div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-sm text-gray-500 dark:text-gray-400">Avg. Turn Time</p><p className="text-2xl font-bold">5 Days</p></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {recentActivity.map(item => (
                            <li key={item.id} className="py-3">
                                <div className="flex items-center space-x-3">
                                    <div className="p-1 rounded-full bg-gray-100">{activityIcons[item.type]}</div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.description}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.date}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
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
                        <div><strong>Member Since:</strong> {formatDate(clientData.createdAt)}</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                     <h3 className="text-xl font-semibold mb-4 flex items-center gap-3"><TagIcon className="w-6 h-6 text-gray-500"/>Subscription</h3>
                     <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span>Plan:</span> <span className="font-medium">{planDetails?.planName || 'Not Subscribed'}</span></div>
                        <div className="flex justify-between"><span>Status:</span> <span className={`font-semibold ${clientData.subscription?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{clientData.subscription?.status || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Properties Covered:</span> <span className="font-medium">{properties.length}</span></div>
                        <div className="flex justify-between"><span>Start Date:</span> <span className="font-medium">{formatDate(clientData.subscription?.startDate)}</span></div>
                        <div className="flex justify-between"><span>Next Billing:</span> <span className="font-medium">{formatDate(clientData.subscription?.renewalDate)}</span></div>
                        <div className="pt-3 mt-3 border-t dark:border-gray-600 flex justify-between"><strong>Monthly Revenue:</strong><span className="font-bold text-blue-600">${monthlyRevenue.toFixed(2)}</span></div>
                     </div>
                </div>
                
                {/* --- UPDATED: Admin Notes Section --- */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4">Admin Notes</h3>
                    <div className="space-y-3 max-h-40 overflow-y-auto mb-4 pr-2">
                        {notes.map((note, index) => (
                            <div key={index} className="flex justify-between items-start text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                                <p className="text-gray-800 dark:text-gray-200">{note.text}</p>
                                <button onClick={() => handleDeleteNote(index)} className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2">
                                    <XCircleIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <textarea 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200" 
                        rows="3" 
                        placeholder="Add a new note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                    ></textarea>
                    <button onClick={handleSaveNote} className="button-secondary w-full mt-2">Save Note</button>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;