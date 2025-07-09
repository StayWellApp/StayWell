// --- src/components/ClientDashboard.js ---
// This is the complete, updated code for a more feature-rich and interactive dashboard.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Building, AlertTriangle, Package, ListTodo, Calendar, PieChart as PieChartIcon, Siren } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ClientDashboard = ({ user, setActiveView, onSelectProperty }) => {
    const [stats, setStats] = useState({ properties: 0, openTasks: 0, lowStockItems: 0 });
    const [urgentTasks, setUrgentTasks] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [taskStatusData, setTaskStatusData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock data for upcoming bookings until a real data source is available
    const upcomingBookings = [
        { id: 'booking-1', propertyName: 'Seaside Villa', guestName: 'John Doe', checkIn: '2025-07-10' },
        { id: 'booking-2', propertyName: 'Downtown Loft', guestName: 'Jane Smith', checkIn: '2025-07-12' },
        { id: 'booking-3', propertyName: 'Mountain Cabin', guestName: 'Sam Wilson', checkIn: '2025-07-15' },
    ];

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        // --- Listener for Properties (for stats) ---
        const propertiesUnsubscribe = onSnapshot(query(collection(db, "properties"), where("ownerId", "==", user.uid)), (snapshot) => {
            setStats(prev => ({ ...prev, properties: snapshot.size }));
        });

        // --- Listener for ALL Tasks (for stats, urgent list, and chart) ---
        const tasksUnsubscribe = onSnapshot(query(collection(db, "tasks"), where("ownerId", "==", user.uid)), (snapshot) => {
            const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Filter for urgent tasks
            setUrgentTasks(allTasks.filter(task => task.priority === 'High' && task.status !== 'Completed').slice(0, 5));
            
            // Calculate stats for the chart
            const statusCounts = allTasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            }, {});
            setTaskStatusData([
                { name: 'Pending', value: statusCounts['Pending'] || 0 },
                { name: 'In Progress', value: statusCounts['In Progress'] || 0 },
                { name: 'Completed', value: statusCounts['Completed'] || 0 },
            ]);

            // Update open tasks count
            setStats(prev => ({ ...prev, openTasks: (statusCounts['Pending'] || 0) + (statusCounts['In Progress'] || 0) }));
        });

        // --- Fetch Low Stock Items ---
        const fetchLowStockItems = async () => {
            const locationsQuery = query(collection(db, "storageLocations"), where("ownerId", "==", user.uid));
            const locationsSnapshot = await getDocs(locationsQuery);
            let lowItems = [];
            for (const locationDoc of locationsSnapshot.docs) {
                const suppliesSnapshot = await getDocs(collection(db, `storageLocations/${locationDoc.id}/supplies`));
                suppliesSnapshot.forEach(supplyDoc => {
                    const supply = supplyDoc.data();
                    if (parseInt(supply.currentStock) < parseInt(supply.parLevel)) {
                        lowItems.push({ ...supply, id: supplyDoc.id, locationName: locationDoc.data().name });
                    }
                });
            }
            setLowStockItems(lowItems);
            setStats(prev => ({ ...prev, lowStockItems: lowItems.length }));
        };
        
        Promise.all([fetchLowStockItems()]).then(() => setLoading(false));

        return () => {
            propertiesUnsubscribe();
            tasksUnsubscribe();
        };
    }, [user]);

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {user?.displayName || user?.email}!</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here’s a summary of your operations.</p>
            </header>

            {loading ? <p className="text-center text-gray-500 dark:text-gray-400">Loading dashboard...</p> : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard icon={<Building size={24} />} title="Total Properties" value={stats.properties} color="blue" onClick={() => setActiveView('properties')} />
                        <StatCard icon={<ListTodo size={24} />} title="Open Tasks" value={stats.openTasks} color="green" onClick={() => setActiveView('tasks')} />
                        <StatCard icon={<AlertTriangle size={24} />} title="Low Stock Items" value={stats.lowStockItems} color="red" onClick={() => setActiveView('storage')} />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <DashboardCard icon={<Siren size={22} />} title="Urgent Issues" className="lg:col-span-2">
                            {urgentTasks.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {urgentTasks.map(task => (
                                        <li key={task.id} className="py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 px-2 -mx-2 rounded-lg" onClick={() => alert(`Navigate to task: ${task.taskName}`)}>
                                            <p className="font-medium text-gray-800 dark:text-gray-100">{task.taskName}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{task.propertyName}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-center py-4 text-gray-500 dark:text-gray-400">No high-priority tasks. Well done!</p>}
                        </DashboardCard>

                        <DashboardCard icon={<PieChartIcon size={22} />} title="Task Status">
                            <TaskStatusChart data={taskStatusData} />
                        </DashboardCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <DashboardCard icon={<Calendar size={22} />} title="Upcoming Bookings">
                            {upcomingBookings.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {upcomingBookings.map(booking => (
                                        <li key={booking.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-gray-100">{booking.guestName}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{booking.propertyName}</p>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{new Date(booking.checkIn).toLocaleDateString()}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-center py-4 text-gray-500 dark:text-gray-400">No upcoming bookings.</p>}
                        </DashboardCard>
                        
                        <DashboardCard icon={<Package size={22} />} title="Low Inventory Alerts">
                            {lowStockItems.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {lowStockItems.map(item => (
                                        <li key={item.id} className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 px-2 -mx-2 rounded-lg" onClick={() => setActiveView('storage')}>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-gray-100">{item.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.locationName}</p>
                                            </div>
                                            <span className="text-sm font-bold text-red-500 dark:text-red-400">{item.currentStock} / {item.parLevel}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-center py-4 text-gray-500 dark:text-gray-400">All supplies are well-stocked.</p>}
                        </DashboardCard>
                    </div>
                </>
            )}
        </div>
    );
};

const StatCard = ({ icon, title, value, color, onClick }) => {
    const colors = {
        blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
        green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
        red: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300',
    };
    return (
        <div onClick={onClick} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer">
            <div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );
};

const DashboardCard = ({ icon, title, children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
        <div className="flex items-center mb-4"><div className="text-gray-500 dark:text-gray-400">{icon}</div><h3 className="ml-3 text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3></div>
        <div className="mt-4">{children}</div>
    </div>
);

const TaskStatusChart = ({ data }) => {
    const COLORS = {
        'Pending': '#facc15', // yellow-400
        'In Progress': '#3b82f6', // blue-500
        'Completed': '#22c55e', // green-500
    };
    const chartData = data.filter(d => d.value > 0);

    if (chartData.length === 0) {
        return <p className="text-center py-4 text-gray-500 dark:text-gray-400">No task data to display.</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', backdropFilter: 'blur(4px)', border: '1px solid #4b5563', borderRadius: '0.75rem' }} />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default ClientDashboard;
