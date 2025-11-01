// src/components/admin/tabs/CommunicationTab.js
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase-config';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Plus, Phone, Mail, Users, Trash2 } from 'lucide-react';

// Helper to get the correct icon for each log type
const communicationIcons = {
    'Call': <Phone className="h-5 w-5 text-blue-500" />,
    'Email': <Mail className="h-5 w-5 text-green-500" />,
    'Meeting': <Users className="h-5 w-5 text-purple-500" />,
    'Other': <Plus className="h-5 w-5 text-gray-500" />,
};

// The new form for adding a communication log
const NewLogForm = ({ clientId }) => {
    const [subject, setSubject] = useState('');
    const [notes, setNotes] = useState('');
    const [type, setType] = useState('Call');
    const [isLoading, setIsLoading] = useState(false);

    const handleAddLog = async (e) => {
        e.preventDefault();
        if (!subject || !notes) {
            toast.error("Please fill out both subject and notes.");
            return;
        }
        setIsLoading(true);

        try {
            const logsCollectionRef = collection(db, 'users', clientId, 'communication_logs');
            await addDoc(logsCollectionRef, {
                type,
                subject,
                notes,
                createdAt: new Date(),
                createdBy: auth.currentUser.displayName || auth.currentUser.email,
            });
            
            // Reset form
            setSubject('');
            setNotes('');
            setType('Call');
            toast.success("Communication logged successfully!");
        } catch (error) {
            console.error("Error adding communication log: ", error);
            toast.error("Failed to log communication.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleAddLog} className="space-y-4">
            <div>
                <label htmlFor="log-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                <input 
                    type="text" 
                    id="log-subject"
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    placeholder="e.g., Follow-up call" 
                    className="input-style mt-1"
                />
            </div>
            
            <div>
                <label htmlFor="log-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <select 
                    id="log-type"
                    value={type} 
                    onChange={(e) => setType(e.target.value)} 
                    className="input-style mt-1"
                >
                    <option>Call</option>
                    <option>Email</option>
                    <option>Meeting</option>
                    <option>Other</option>
                </select>
            </div>

            <div>
                <label htmlFor="log-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <textarea 
                    id="log-notes"
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    rows="4" 
                    placeholder="Add notes..." 
                    className="input-style mt-1"
                />
            </div>
            <button type="submit" className="button-primary w-full flex items-center justify-center gap-2" disabled={isLoading}>
                <Plus className="w-5 h-5"/> {isLoading ? 'Logging...' : 'Log Communication'}
            </button>
        </form>
    );
};

// The main component that displays the list of logs
const CommunicationTab = ({ clientId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch logs from Firebase in real-time
    useEffect(() => {
        if (!clientId) return;
        
        const logsCollectionRef = collection(db, 'users', clientId, 'communication_logs');
        const q = query(logsCollectionRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLogs(logsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching communication logs: ", error);
            toast.error("Failed to load communication history.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [clientId]);

    const handleDeleteLog = async (logId) => {
        if (!window.confirm("Are you sure you want to delete this log?")) return;

        try {
            const logDocRef = doc(db, 'users', clientId, 'communication_logs', logId);
            await deleteDoc(logDocRef);
            toast.success("Log deleted successfully!");
        } catch (error) {
            console.error("Error deleting log: ", error);
            toast.error("Failed to delete log.");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Add New Log */}
            <div className="md:col-span-1">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Log New Communication</h3>
                    <NewLogForm clientId={clientId} />
                </div>
            </div>

            {/* Column 2: History */}
            <div className="md:col-span-2">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Communication History</h3>
                    {loading ? (
                        <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No communication logs found.</p>
                    ) : (
                        <ul className="space-y-6">
                            {logs.map(log => (
                                <li key={log.id} className="flex gap-4 group">
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center">
                                        {communicationIcons[log.type] || communicationIcons['Other']}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-gray-800 dark:text-gray-100">{log.subject}</p>
                                            <button 
                                                onClick={() => handleDeleteLog(log.id)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                                aria-label="Delete log"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                            {log.type} by {log.createdBy} on {log.createdAt.toDate().toLocaleDateString()}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{log.notes}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommunicationTab;