// --- src/components/ClientDashboard.js ---
// Replace the entire contents of this file.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bed, CalendarCheck, ClipboardList, AlertTriangle } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const ClientDashboard = ({ user }) => {
    const [properties, setProperties] = useState([]);
    const [tasks, setTasks] = useState([]);
    
    useEffect(() => {
        if (!user) return;

        const propertiesQuery = query(collection(db, "properties"), where("ownerId", "==", user.uid));
        const propertiesUnsubscribe = onSnapshot(propertiesQuery, (snapshot) => {
            setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const tasksQuery = query(collection(db, "tasks"), where("ownerId", "==", user.uid));
        const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            propertiesUnsubscribe();
            tasksUnsubscribe();
        };
    }, [user]);

    const tasksByStatus = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {});

    const pieData = [
        { name: 'Pending', value: tasksByStatus['Pending'] || 0 },
        { name: 'In Progress', value: tasksByStatus['In Progress'] || 0 },
        { name: 'Completed', value: tasksByStatus['Completed'] || 0 },
    ];

    const COLORS = ['#FBBF24', '#3B82F6', '#10B981'];

    const revenueData = [
        { name: 'Jan', revenue: 4200 }, { name: 'Feb', revenue: 3500 },
        { name: 'Mar', revenue: 5800 }, { name: 'Apr', revenue: 5100 },
        { name: 'May', revenue: 6500 }, { name: 'Jun', revenue: 7200 },
    ];

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {user.displayName || 'Host'}!</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Here's a snapshot of your property management operations.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <StatCard title="Total Properties" value={properties.length} icon={<Bed size={24} className="text-purple-600"/>} color="bg-purple-100 dark:bg-purple-900/50" />
                <StatCard title="Upcoming Bookings" value="7" icon={<CalendarCheck size={24} className="text-green-600"/>} color="bg-green-100 dark:bg-green-900/50" />
                <StatCard title="Pending Tasks" value={tasksByStatus['Pending'] || 0} icon={<ClipboardList size={24} className="text-yellow-600"/>} color="bg-yellow-100 dark:bg-yellow-900/50" />
                <StatCard title="Urgent Issues" value="2" icon={<AlertTriangle size={24} className="text-red-600"/>} color="bg-red-100 dark:bg-red-900/50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Revenue Overview</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                            <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                            <Tooltip 
                                cursor={{fill: 'rgba(156, 163, 175, 0.1)'}}
                                contentStyle={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.75rem'
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '14px', color: '#4b5563' }} />
                            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                     <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Task Status</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', borderRadius: '0.75rem' }} />
                            <Legend wrapperStyle={{ color: '#9ca3af' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
