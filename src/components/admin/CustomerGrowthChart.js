// src/components/admin/CustomerGrowthChart.js

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import { TrendingUp } from 'lucide-react';

const ChartPlaceholder = ({ title }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-80 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-md animate-pulse">
            <TrendingUp className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        </div>
    </div>
);

const CustomerGrowthChart = ({ clients, loading }) => {
    if (loading) {
        return <ChartPlaceholder title="Customer Growth" />;
    }

    const data = clients
        .filter(c => c.createdAt) // Ensure createdAt exists
        .reduce((acc, client) => {
            const month = moment(client.createdAt.toDate()).format('YYYY-MM');
            const found = acc.find(item => item.month === month);
            if (found) {
                found.newClients++;
            } else {
                acc.push({ month, newClients: 1 });
            }
            return acc;
        }, [])
        .sort((a, b) => a.month.localeCompare(b.month));

    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-80">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Customer Growth</h3>
            <ResponsiveContainer width="100%" height="90%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="currentColor" />
                    <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                            border: '1px solid #ccc',
                            color: '#333'
                        }} 
                    />
                    <Bar dataKey="newClients" fill="#4f46e5" name="New Clients"/>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CustomerGrowthChart;