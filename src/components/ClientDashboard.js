import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Building, AlertTriangle, ListTodo, Calendar, PieChart as PieChartIcon, Siren, X, ClipboardCheck } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TaskDetailModal } from './TaskViews';

const ClientDashboard = ({ user, setActiveView }) => {
    const [stats, setStats] = useState({ properties: 0, openTasks: 0, lowStockItems: 0 });
    const [allOpenTasks, setAllOpenTasks] = useState([]);
    const [todaysTasks, setTodaysTasks] = useState([]);
    const [pendingTasks, setPendingTasks] = useState([]);
    const [taskStatusData, setTaskStatusData] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Hardcoded upcoming bookings data
    const upcomingBookings = [
        { id: 'booking-1', propertyName: 'Seaside Villa', guestName: 'John Doe', checkIn: '2025-07-10', platform: 'Airbnb' },
        { id: 'booking-2', propertyName: 'Downtown Loft', guestName: 'Jane Smith', checkIn: '2025-07-12', platform: 'Booking.com' },
        { id: 'booking-3', propertyName: 'Mountain Cabin', guestName: 'Peter Jones', checkIn: '2025-07-14', platform: 'VRBO' },
    ];

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const propertiesUnsubscribe = onSnapshot(query(collection(db, "properties"), where("ownerId", "==", user.uid)), (snapshot) => {
            setStats(prev => ({ ...prev, properties: snapshot.size }));
        });

        // This listener gets all tasks for the user to categorize them
        const tasksUnsubscribe = onSnapshot(query(collection(db, "tasks"), where("ownerId", "==", user.uid)), (snapshot) => {
            const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // --- Categorize tasks ---
            const openTasks = allTasks.filter(task => task.status !== 'Completed');
            const todayISO = new Date().toISOString().split('T')[0];
            
            setAllOpenTasks(openTasks);
            setTodaysTasks(allTasks.filter(task => task.scheduledDate === todayISO && task.status !== 'Completed'));
            setPendingTasks(allTasks.filter(task => task.status === 'Pending'));

            // --- Aggregate data for stats and charts ---
            const statusCounts = allTasks.reduce((acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            }, {});

            setTaskStatusData([
                { name: 'Pending', value: statusCounts['Pending'] || 0 },
                { name: 'In Progress', value: statusCounts['In Progress'] || 0 },
                { name: 'Completed', value: statusCounts['Completed'] || 0 },
            ]);
            setStats(prev => ({ ...prev, openTasks: openTasks.length }));
        });

        const teamUnsubscribe = onSnapshot(query(collection(db, 'users'), where('ownerId', '==', user.uid)), (snapshot) => {
            setTeam(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });

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
        
        fetchLowStockItems().finally(() => setLoading(false));

        return () => {
            propertiesUnsubscribe();
            tasksUnsubscribe();
            teamUnsubscribe();
        };
    }, [user]);

    const handleOpenTask = (task) => {
        setSelectedTask(task);
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {user?.displayName || user?.email}!</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here’s a summary of your operations.</p>
            </header>

            {loading ? <p className="text-center text-gray-500 dark:text-gray-400">Loading dashboard...</p> : (
                <div className="space-y-8">
                    {/* --- Top Row: 3 Stat Cards --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard icon={<Building size={24} />} title="Total Properties" value={stats.properties} color="blue" onClick={() => setActiveView('properties')} />
                        <StatCard icon={<ListTodo size={24} />} title="Open Tasks" value={stats.openTasks} color="green" onClick={() => setIsTasksModalOpen(true)} />
                        <StatCard icon={<AlertTriangle size={24} />} title="Low Stock Items" value={stats.lowStockItems} color="red" onClick={() => setIsStockModalOpen(true)} />
                    </div>
                    
                    {/* --- Middle Row: Today's Tasks, Pending Tasks, Pie Chart --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <DashboardCard icon={<ClipboardCheck size={22} />} title="Today's Tasks">
                            <TaskList tasks={todaysTasks} onTaskClick={handleOpenTask} emptyMessage="No tasks scheduled for today." />
                        </DashboardCard>
                        
                        <DashboardCard icon={<Siren size={22} />} title="Pending Tasks">
                            <TaskList tasks={pendingTasks} onTaskClick={handleOpenTask} emptyMessage="No tasks are pending." />
                        </DashboardCard>

                        <DashboardCard icon={<PieChartIcon size={22} />} title="Task Status">
                            <TaskStatusChart data={taskStatusData} />
                        </DashboardCard>
                    </div>

                    {/* --- Bottom Row: Upcoming Bookings --- */}
                    <DashboardCard icon={<Calendar size={22} />} title="Upcoming Bookings">
                        {upcomingBookings.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {upcomingBookings.map(booking => (
                                    <li key={booking.id} className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => setSelectedBooking(booking)}>
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-gray-100">{booking.guestName}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{booking.propertyName}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{new Date(booking.checkIn).toLocaleDateString()}</span>
                                            <p className="text-xs text-gray-400">{booking.platform}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-center py-4 text-gray-500 dark:text-gray-400">No upcoming bookings.</p>}
                    </DashboardCard>
                </div>
            )}

            {/* Modals */}
            {isTasksModalOpen && <TasksModal tasks={allOpenTasks} onOpenTask={handleOpenTask} onClose={() => setIsTasksModalOpen(false)} />}
            {isStockModalOpen && <StockModal items={lowStockItems} onClose={() => setIsStockModalOpen(false)} />}
            {selectedTask && <TaskDetailModal task={selectedTask} team={team} user={user} onClose={() => setSelectedTask(null)} />}
            {selectedBooking && <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
        </div>
    );
};


// --- Reusable Components ---

const StatCard = ({ icon, title, value, color, onClick }) => {
    const colors = {
        blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
        green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
        red: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300',
    };
    return (
        <div onClick={onClick} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer">
            <div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div>
            <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p><p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p></div>
        </div>
    );
};

const DashboardCard = ({ icon, title, children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${className} h-full flex flex-col`}>
        <div className="flex items-center mb-4 flex-shrink-0"><div className="text-gray-500 dark:text-gray-400">{icon}</div><h3 className="ml-3 text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3></div>
        <div className="mt-2 flex-grow">{children}</div>
    </div>
);

const TaskList = ({ tasks, onTaskClick, emptyMessage }) => {
    if (tasks.length === 0) {
        return <p className="text-center py-4 text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
    }
    return (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 -mx-2">
            {tasks.map(task => (
                <li key={task.id} className="py-3 px-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center" onClick={() => onTaskClick(task)}>
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">{task.taskName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{task.propertyName}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{task.status}</span>
                </li>
            ))}
        </ul>
    );
};

const TaskStatusChart = ({ data }) => {
    const COLORS = { 'Pending': '#facc15', 'In Progress': '#3b82f6', 'Completed': '#22c55e' };
    const chartData = data.filter(d => d.value > 0);
    if (chartData.length === 0) return <p className="text-center py-4 text-gray-500 dark:text-gray-400">No task data.</p>;
    
    return (
        <ResponsiveContainer width="100%" height={150}>
            <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                    {chartData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} stroke={0} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', backdropFilter: 'blur(4px)', border: '1px solid #4b5563', borderRadius: '0.75rem' }} />
                <Legend iconSize={10} wrapperStyle={{fontSize: '12px'}} />
            </PieChart>
        </ResponsiveContainer>
    );
};

// --- Modal Components ---

const TasksModal = ({ tasks, onOpenTask, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-2xl border dark:border-gray-700 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">All Open Tasks</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><X size={24} /></button></div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto">
                {tasks.map(task => (
                    <li key={task.id} onClick={() => onOpenTask(task)} className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex justify-between items-center">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">{task.taskName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{task.propertyName}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-800' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{task.priority}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const StockModal = ({ items, onClose }) => (
     <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-2xl border dark:border-gray-700 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Low Stock Items</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><X size={24} /></button></div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto">
                {items.map(item => (
                    <li key={item.id} className="p-4 flex justify-between items-center">
                        <div><p className="font-medium text-gray-800 dark:text-gray-100">{item.name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{item.locationName}</p></div>
                        <span className="text-sm font-bold text-red-500 dark:text-red-400">{item.currentStock} / {item.parLevel}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const BookingModal = ({ booking, onClose }) => (
     <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Booking Details</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><X size={24} /></button></div>
            <div className="space-y-4">
                <p><strong>Property:</strong> {booking.propertyName}</p>
                <p><strong>Guest:</strong> {booking.guestName}</p>
                <p><strong>Check-in:</strong> {new Date(booking.checkIn).toLocaleDateString()}</p>
                <p><strong>Platform:</strong> {booking.platform}</p>
                <p className="text-sm text-gray-500 pt-4">Further details from booking platforms like Airbnb can be integrated here.</p>
            </div>
        </div>
    </div>
);

export default ClientDashboard;