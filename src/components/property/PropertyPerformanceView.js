// src/components/property/PropertyPerformanceView.js
// FIXED: Added buttons to control the timeframe, using the setTimeframe state setter.

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Percent } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const PerformanceView = ({ property }) => {
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState(30);

    useEffect(() => {
        // ... (data fetching logic remains the same)
        setLoading(true);
        const tasksQuery = query(collection(db, "tasks"), where("propertyId", "==", property.id), where("status", "==", "Completed"));
        const eventsQuery = query(collection(db, "events"), where("propertyId", "==", property.id));

        const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
            setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => {
            unsubTasks();
            unsubEvents();
        };
    }, [property.id]);
    
    // ... (data processing and chart data logic remains the same)
    const getFilteredData = () => {
        const now = new Date();
        const filteredTasks = tasks.filter(task => {
            const taskDate = task.completedAt?.toDate();
            if (!taskDate) return false;
            const diffDays = (now - taskDate) / (1000 * 60 * 60 * 24);
            return diffDays <= timeframe;
        });

        const filteredEvents = events.filter(event => {
            const eventDate = event.start.toDate();
            if (!eventDate) return false;
            const diffDays = (now - eventDate) / (1000 * 60 * 60 * 24);
            return diffDays <= timeframe;
        });

        return { filteredTasks, filteredEvents };
    };

    const { filteredTasks, filteredEvents } = getFilteredData();

    const grossRevenue = filteredEvents.reduce((acc, event) => acc + (Number(event.payout) || 0), 0);
    const totalExpenses = filteredTasks.reduce((acc, task) => acc + (Number(task.cost) || 0), 0);
    const netProfit = grossRevenue - totalExpenses;

    const bookedNights = filteredEvents.reduce((acc, event) => {
        const start = event.start.toDate();
        const end = event.end.toDate();
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return acc + diffDays;
    }, 0);
    const occupancyRate = timeframe > 0 ? ((bookedNights / timeframe) * 100).toFixed(1) : 0;
    
    const expenseByCategory = filteredTasks.reduce((acc, task) => {
        const category = task.category || 'Other';
        acc[category] = (acc[category] || 0) + (Number(task.cost) || 0);
        return acc;
    }, {});

    const pieChartData = {
        labels: Object.keys(expenseByCategory),
        datasets: [{
            data: Object.values(expenseByCategory),
            backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
            borderColor: '#1F2937',
            borderWidth: 2,
        }],
    };
    
    const profitLossData = {
        labels: [`Last ${timeframe} Days`],
        datasets: [
            { label: 'Gross Revenue', data: [grossRevenue], backgroundColor: '#10B981' },
            { label: 'Total Expenses', data: [totalExpenses], backgroundColor: '#EF4444' },
            { label: 'Net Profit', data: [netProfit], backgroundColor: '#3B82F6' },
        ],
    };


    const KPICard = ({ title, value, icon, colorClass }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full ${colorClass}`}>{icon}</div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
        </div>
    );
    
    if (loading) {
        return <div className="text-center p-8">Loading performance data...</div>
    }

    return (
        <div className="space-y-8">
            {/* --- NEW Timeframe Selector --- */}
            <div className="flex justify-end items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Show data for last:</span>
                {[30, 60, 90].map(days => (
                    <button 
                        key={days} 
                        onClick={() => setTimeframe(days)} 
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${timeframe === days ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                    >
                        {days} days
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <KPICard title="Gross Revenue" value={`$${grossRevenue.toFixed(2)}`} icon={<TrendingUp size={18} className="text-white"/>} colorClass="bg-green-500" />
                <KPICard title="Total Expenses" value={`$${totalExpenses.toFixed(2)}`} icon={<TrendingDown size={18} className="text-white"/>} colorClass="bg-red-500" />
                <KPICard title="Net Profit" value={`$${netProfit.toFixed(2)}`} icon={<DollarSign size={18} className="text-white"/>} colorClass="bg-blue-500" />
                <KPICard title="Occupancy Rate" value={`${occupancyRate}%`} icon={<Percent size={18} className="text-white"/>} colorClass="bg-yellow-500" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Profit & Loss ({`Last ${timeframe} Days`})</h3>
                    <div className="relative h-96">
                        <Bar options={{ responsive: true, maintainAspectRatio: false }} data={profitLossData} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center"><PieChart size={18} className="mr-2" />Expense Breakdown</h3>
                    {filteredTasks.length > 0 ? (
                        <div className="relative h-96">
                             <Pie options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} data={pieChartData} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">No expense data</div>
                    )}
                </div>
            </div>
        </div>
    );
};