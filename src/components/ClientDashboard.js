// --- src/components/ClientDashboard.js ---
// This is the complete, updated code for a dynamic dashboard.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Building, AlertTriangle, Package, ListTodo, Plus } from 'lucide-react';

const ClientDashboard = ({ user }) => {
    const [stats, setStats] = useState({ properties: 0, openTasks: 0, lowStockItems: 0 });
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // --- Listener for Properties (for stats) ---
        const propertiesQuery = query(collection(db, "properties"), where("ownerId", "==", user.uid));
        const propertiesUnsubscribe = onSnapshot(propertiesQuery, (snapshot) => {
            setStats(prevStats => ({ ...prevStats, properties: snapshot.size }));
        });

        // --- Listener for Tasks (for stats and upcoming tasks list) ---
        const tasksQuery = query(collection(db, "tasks"), where("ownerId", "==", user.uid), where("status", "!=", "Completed"));
        const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            setStats(prevStats => ({ ...prevStats, openTasks: snapshot.size }));
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUpcomingTasks(tasks.slice(0, 5)); // Show the 5 most recent open tasks
        });

        // --- Fetch Low Stock Items (more complex query) ---
        const fetchLowStockItems = async () => {
            const locationsQuery = query(collection(db, "storageLocations"), where("ownerId", "==", user.uid));
            const locationsSnapshot = await getDocs(locationsQuery);
            let lowItems = [];

            for (const locationDoc of locationsSnapshot.docs) {
                const suppliesQuery = query(
                    collection(db, `storageLocations/${locationDoc.id}/supplies`)
                );
                const suppliesSnapshot = await getDocs(suppliesQuery);
                suppliesSnapshot.forEach(supplyDoc => {
                    const supply = supplyDoc.data();
                    if (parseInt(supply.currentStock) < parseInt(supply.parLevel)) {
                        lowItems.push({ 
                            ...supply, 
                            id: supplyDoc.id, 
                            locationName: locationDoc.data().name 
                        });
                    }
                });
            }
            setLowStockItems(lowItems);
            setStats(prevStats => ({ ...prevStats, lowStockItems: lowItems.length }));
        };
        
        fetchLowStockItems();
        setLoading(false);

        // Cleanup subscriptions on unmount
        return () => {
            propertiesUnsubscribe();
            tasksUnsubscribe();
        };
    }, [user]);

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Welcome back, {user?.displayName || user?.email}!
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Here’s a summary of your operations.
                </p>
            </header>

            {loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Loading dashboard...</p>
            ) : (
                <>
                    {/* --- Stat Cards --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard icon={<Building size={24} />} title="Total Properties" value={stats.properties} color="blue" />
                        <StatCard icon={<ListTodo size={24} />} title="Open Tasks" value={stats.openTasks} color="green" />
                        <StatCard icon={<AlertTriangle size={24} />} title="Low Stock Items" value={stats.lowStockItems} color="red" />
                    </div>

                    {/* --- Dashboard Columns --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Upcoming Tasks Column */}
                        <DashboardCard
                            icon={<ListTodo size={22} />}
                            title="Upcoming Tasks"
                        >
                            {upcomingTasks.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {upcomingTasks.map(task => (
                                        <li key={task.id} className="py-3">
                                            <p className="font-medium text-gray-800 dark:text-gray-100">{task.taskName}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{task.propertyName}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center py-4 text-gray-500 dark:text-gray-400">No open tasks. Great job!</p>
                            )}
                        </DashboardCard>

                        {/* Low Inventory Column */}
                        <DashboardCard
                            icon={<Package size={22} />}
                            title="Low Inventory Alerts"
                        >
                            {lowStockItems.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {lowStockItems.map(item => (
                                        <li key={item.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-gray-100">{item.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.locationName}</p>
                                            </div>
                                            <span className="text-sm font-bold text-red-500 dark:text-red-400">
                                                {item.currentStock} / {item.parLevel}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center py-4 text-gray-500 dark:text-gray-400">All supplies are well-stocked.</p>
                            )}
                        </DashboardCard>
                    </div>
                </>
            )}
        </div>
    );
};

// Helper component for stat cards
const StatCard = ({ icon, title, value, color }) => {
    const colors = {
        blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
        green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
        red: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300',
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-full ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );
};

// Helper component for dashboard content cards
const DashboardCard = ({ icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center mb-4">
            <div className="text-gray-500 dark:text-gray-400">
                {icon}
            </div>
            <h3 className="ml-3 text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        </div>
        <div className="mt-4">
            {children}
        </div>
    </div>
);

export default ClientDashboard;
