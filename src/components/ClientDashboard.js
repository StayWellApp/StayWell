import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import debounce from 'lodash.debounce';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Grid Layout Imports
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Component Imports
import { TaskDetailModal } from './TaskViews';
import DashboardWidget from './DashboardWidget';

// Icon Imports
import { Building, AlertTriangle, ListTodo, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ResponsiveGridLayout = WidthProvider(Responsive);

const defaultLayouts = {
    lg: [
        { i: 'properties', x: 0, y: 0, w: 1, h: 2 },
        { i: 'openTasks', x: 1, y: 0, w: 1, h: 2 },
        { i: 'lowStock', x: 2, y: 0, w: 1, h: 2 },
        { i: 'todaysTasks', x: 0, y: 2, w: 2, h: 3, minH: 3 },
        { i: 'taskStatus', x: 2, y: 2, w: 1, h: 3, minH: 2 },
        { i: 'upcomingBookings', x: 0, y: 5, w: 3, h: 2, minH: 2 },
    ],
};

const sanitizeLayout = (layout) => {
    const requiredKeys = ['w', 'h', 'x', 'y', 'i', 'minW', 'maxW', 'minH', 'maxH', 'static', 'isDraggable', 'isResizable'];
    return layout.map(item => {
        const sanitizedItem = {};
        for (const key of requiredKeys) {
            if (item[key] !== undefined) {
                sanitizedItem[key] = item[key];
            }
        }
        return sanitizedItem;
    });
};

const PropertiesWidgetContent = ({ stats, setActiveView }) => (
    <div className="h-full flex flex-col justify-between text-center cursor-pointer" onClick={() => setActiveView('properties')}>
        <div className="flex-grow flex flex-col items-center justify-center">
            <Building className="text-blue-500 mb-3" size={36} />
            <p className="text-5xl font-bold text-gray-800 dark:text-gray-100">{stats.properties}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Total Properties</p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 hover:underline">Click to manage</p>
    </div>
);

const OpenTasksWidgetContent = ({ stats, openModal }) => (
     <div className="h-full flex flex-col justify-between text-center cursor-pointer" onClick={openModal}>
        <div className="flex-grow flex flex-col items-center justify-center">
            <ListTodo className="text-green-500 mb-3" size={36} />
            <p className="text-5xl font-bold text-gray-800 dark:text-gray-100">{stats.openTasks}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Open Tasks</p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 hover:underline">Click to view all</p>
    </div>
);

const LowStockWidgetContent = ({ stats, openModal }) => (
     <div className="h-full flex flex-col justify-between text-center cursor-pointer" onClick={openModal}>
        <div className="flex-grow flex flex-col items-center justify-center">
            <AlertTriangle className="text-red-500 mb-3" size={36} />
            <p className="text-5xl font-bold text-gray-800 dark:text-gray-100">{stats.lowStockItems}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Low Stock Items</p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 hover:underline">Click to view</p>
    </div>
);


const ClientDashboard = ({ user, setActiveView }) => {
    const [stats, setStats] = useState({ properties: 0, openTasks: 0, lowStockItems: 0 });
    const [allOpenTasks, setAllOpenTasks] = useState([]);
    const [todaysTasks, setTodaysTasks] = useState([]);
    const [taskStatusData, setTaskStatusData] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [layouts, setLayouts] = useState(null);

    const upcomingBookings = [
        { id: 'booking-1', propertyName: 'Seaside Villa', guestName: 'John Doe', checkIn: '2025-07-10', platform: 'Airbnb' },
        { id: 'booking-2', propertyName: 'Downtown Loft', guestName: 'Jane Smith', checkIn: '2025-07-12', platform: 'Booking.com' },
        { id: 'booking-3', propertyName: 'Mountain Cabin', guestName: 'Peter Jones', checkIn: '2025-07-14', platform: 'VRBO' },
    ];

    useEffect(() => {
        if (!user) return;
        
        const propertiesUnsubscribe = onSnapshot(query(collection(db, "properties"), where("ownerId", "==", user.uid)), (snapshot) => {
            setStats(prev => ({ ...prev, properties: snapshot.size }));
        });

        const tasksUnsubscribe = onSnapshot(query(collection(db, "tasks"), where("ownerId", "==", user.uid)), (snapshot) => {
            const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const openTasks = allTasks.filter(task => task.status !== 'Completed');
            const todayISO = new Date().toISOString().split('T')[0];
            
            setAllOpenTasks(openTasks);
            setTodaysTasks(allTasks.filter(task => task.scheduledDate === todayISO && task.status !== 'Completed'));
            
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
        
        fetchLowStockItems();
        
        const loadLayout = async () => {
            const layoutDocRef = doc(db, 'users', user.uid, 'configs', 'clientDashboardLayout');
            const docSnap = await getDoc(layoutDocRef);
            setLayouts((docSnap.exists() && docSnap.data().lg) ? docSnap.data() : defaultLayouts);
            setLoading(false);
        };
        loadLayout();

        return () => {
            propertiesUnsubscribe();
            tasksUnsubscribe();
            teamUnsubscribe();
        };
    }, [user]);

    const saveLayoutToFirestore = useCallback(
        debounce((newLayouts) => {
            if (user) {
                const sanitizedLayouts = { lg: sanitizeLayout(newLayouts.lg || []) };
                const layoutDocRef = doc(db, 'users', user.uid, 'configs', 'clientDashboardLayout');
                setDoc(layoutDocRef, sanitizedLayouts, { merge: true });
            }
        }, 1000),
        [user]
    );

    const onLayoutChange = (layout, newLayouts) => {
        setLayouts(newLayouts);
        saveLayoutToFirestore(newLayouts);
    };

    const handleOpenTask = (task) => {
        setSelectedTask(task);
    };

    if (loading || !layouts) {
        return <p className="text-center text-gray-500 dark:text-gray-400 p-8">Loading dashboard...</p>;
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {user?.displayName || user?.email}!</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here’s a summary of your operations.</p>
            </header>

            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                onLayoutChange={onLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 3, md: 2, sm: 1, xs: 1, xxs: 1 }}
                rowHeight={80}
                draggableHandle=".drag-handle"
            >
                <div key="properties">
                    <DashboardWidget showDragHandle={false}>
                       <PropertiesWidgetContent stats={stats} setActiveView={setActiveView} />
                    </DashboardWidget>
                </div>
                <div key="openTasks">
                    <DashboardWidget showDragHandle={false}>
                       <OpenTasksWidgetContent stats={stats} openModal={() => setIsTasksModalOpen(true)} />
                    </DashboardWidget>
                </div>
                <div key="lowStock">
                    <DashboardWidget showDragHandle={false}>
                        <LowStockWidgetContent stats={stats} openModal={() => setIsStockModalOpen(true)} />
                    </DashboardWidget>
                </div>
                <div key="todaysTasks">
                    <DashboardWidget title="Today's Tasks">
                        <TaskList tasks={todaysTasks} onTaskClick={handleOpenTask} emptyMessage="No tasks scheduled for today." />
                    </DashboardWidget>
                </div>
                <div key="taskStatus">
                    <DashboardWidget title="Task Status Overview">
                        <TaskStatusChart data={taskStatusData} />
                    </DashboardWidget>
                </div>
                <div key="upcomingBookings">
                    <DashboardWidget title="Upcoming Bookings">
                         {upcomingBookings.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {upcomingBookings.map(booking => (
                                    <li key={booking.id} className="py-2 flex justify-between items-center" onClick={() => setSelectedBooking(booking)}>
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-gray-100">{booking.guestName}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{booking.propertyName}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{new Date(booking.checkIn).toLocaleDateString()}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-center py-4 text-gray-500 dark:text-gray-400">No upcoming bookings.</p>}
                    </DashboardWidget>
                </div>
            </ResponsiveGridLayout>

            {isTasksModalOpen && <TasksModal tasks={allOpenTasks} onOpenTask={handleOpenTask} onClose={() => setIsTasksModalOpen(false)} />}
            {isStockModalOpen && <StockModal items={lowStockItems} onClose={() => setIsStockModalOpen(false)} />}
            {selectedTask && <TaskDetailModal task={selectedTask} team={team} user={user} onClose={() => setSelectedTask(null)} />}
            {selectedBooking && <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
        </div>
    );
};

const TaskList = ({ tasks, onTaskClick, emptyMessage }) => {
    if (!tasks || tasks.length === 0) {
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
        <ResponsiveContainer width="100%" height="90%" debounce={1}>
            <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={5}>
                    {chartData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} stroke={0} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', backdropFilter: 'blur(4px)', border: '1px solid #4b5563', borderRadius: '0.75rem' }} />
                <Legend iconSize={10} wrapperStyle={{fontSize: '12px'}} />
            </PieChart>
        </ResponsiveContainer>
    );
};

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