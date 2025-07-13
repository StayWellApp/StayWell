import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Building, AlertTriangle, ListTodo, Calendar, PieChart as PieChartIcon, X, Search } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TaskDetailModal } from './TaskViews';
import { KanbanColumn } from './property/PropertyTasksView';

const ClientDashboard = ({ user, setActiveView }) => {
    const [stats, setStats] = useState({ properties: 0, openTasks: 0, lowStockItems: 0 });
    const [allOpenTasks, setAllOpenTasks] = useState([]);
    const [taskStatusData, setTaskStatusData] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);

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

        // This query now gets ALL tasks to calculate status for the chart
        const tasksUnsubscribe = onSnapshot(query(collection(db, "tasks"), where("ownerId", "==", user.uid)), (snapshot) => {
            const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const openTasks = allTasks.filter(task => task.status !== 'Completed');
            setAllOpenTasks(openTasks);
            
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

    const handleOpenTaskDetail = (task) => {
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
                    {/* --- MODIFIED: Grid layout updated to have 4 columns --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={<Building size={24} />} title="Total Properties" value={stats.properties} color="blue" onClick={() => setActiveView('properties')} />
                        <StatCard icon={<ListTodo size={24} />} title="Open Tasks" value={stats.openTasks} color="green" onClick={() => setIsTasksModalOpen(true)} />
                        <StatCard icon={<AlertTriangle size={24} />} title="Low Stock Items" value={stats.lowStockItems} color="red" onClick={() => setIsStockModalOpen(true)} />
                        {/* --- NEW: Task Status Chart Card --- */}
                        <StatCard icon={<PieChartIcon size={24} />} title="Task Status" value="" color="yellow" chart={<TaskStatusChart data={taskStatusData} />} />
                    </div>
                    
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

            {isTasksModalOpen && <AdvancedTasksModal tasks={allOpenTasks} onOpenTask={handleOpenTaskDetail} onClose={() => setIsTasksModalOpen(false)} />}
            {isStockModalOpen && <StockModal items={lowStockItems} onClose={() => setIsStockModalOpen(false)} />}
            {selectedTask && <TaskDetailModal task={selectedTask} team={team} user={user} onClose={() => setSelectedTask(null)} />}
            {selectedBooking && <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
        </div>
    );
};

// --- MODIFIED: StatCard now accepts a chart prop ---
const StatCard = ({ icon, title, value, color, onClick, chart }) => {
    const colors = {
        blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
        green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
        red: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300'
    };
    return (
        <div onClick={onClick} className={`bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center space-x-4 transition-all ${onClick ? 'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer' : ''}`}>
            <div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                {value && <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>}
                {chart && <div className="mt-2 w-full h-16">{chart}</div>}
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

// --- NEW: Chart component for the Task Status card ---
const TaskStatusChart = ({ data }) => {
    const COLORS = { 'Pending': '#facc15', 'In Progress': '#3b82f6', 'Completed': '#22c55e' };
    const chartData = data.filter(d => d.value > 0);
    if (chartData.length === 0) return <p className="text-center py-4 text-gray-500 dark:text-gray-400">No task data.</p>;
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={35}>
                    {chartData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />)}
                </Pie>
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(31, 41, 55, 0.8)', 
                        backdropFilter: 'blur(4px)', 
                        border: '1px solid #4b5563', 
                        borderRadius: '0.75rem',
                        color: '#FFF'
                    }} 
                />
            </PieChart>
        </ResponsiveContainer>
    );
};


// --- The rest of the components remain the same ---

const AdvancedTasksModal = ({ tasks, onOpenTask, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredTasks = useMemo(() => tasks.filter(task => task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) || task.propertyName.toLowerCase().includes(searchTerm.toLowerCase())), [tasks, searchTerm]);
    const groupedTasks = useMemo(() => ({'Pending': filteredTasks.filter(t => t.status === 'Pending'), 'In Progress': filteredTasks.filter(t => t.status === 'In Progress'), }), [filteredTasks]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-xl w-full max-w-6xl border dark:border-gray-700 max-h-[90vh] flex flex-col">
                <div className="flex-shrink-0">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">All Open Tasks</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><X size={24} /></button></div>
                    <div className="relative w-full md:w-1/2 mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" placeholder="Search by task or property name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-style pl-10 w-full bg-white dark:bg-gray-900" />
                    </div>
                </div>
                <div className="flex-grow min-h-0 flex flex-col md:flex-row gap-6 overflow-y-auto">
                    <KanbanColumn title="Pending" tasks={groupedTasks.Pending} onTaskClick={onOpenTask} />
                    <KanbanColumn title="In Progress" tasks={groupedTasks['In Progress']} onTaskClick={onOpenTask} />
                </div>
            </div>
        </div>
    );
};

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