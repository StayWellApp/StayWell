import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { TaskDetailModal } from './TaskViews';

const StaffDashboard = ({ user, userData }) => {
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        if (!user) return;
        
        // Query for tasks assigned to the current staff member
        const tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", user.uid));
        
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyTasks(tasks);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome, {user.displayName}!</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here are your assigned tasks.</p>
            </header>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                 <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">My Open Tasks</h3>
                {loading ? <p>Loading tasks...</p> : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {myTasks.length > 0 ? myTasks.map(task => (
                            <li key={task.id} onClick={() => setSelectedTask(task)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{task.taskName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{task.propertyName}</p>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{task.status}</span>
                            </li>
                        )) : <p className="text-center py-8 text-gray-500 dark:text-gray-400">You have no assigned tasks.</p>}
                    </ul>
                )}
            </div>
            
            {selectedTask && <TaskDetailModal task={selectedTask} team={[]} checklistTemplates={[]} onClose={() => setSelectedTask(null)} />}
        </div>
    );
};

export default StaffDashboard;