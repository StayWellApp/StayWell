// src/components/admin/RevenueByPlanChart.js

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const ChartPlaceholder = ({ title }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-80 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-md animate-pulse">
            <PieIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        </div>
    </div>
);


// Dummy data
const data = [
    { name: 'Basic Plan', value: 400 },
    { name: 'Pro Plan', value: 300 },
    { name: 'Enterprise Plan', value: 200 },
];
const COLORS = ['#60a5fa', '#818cf8', '#4f46e5'];

const RevenueByPlanChart = ({ clients, loading }) => {
    if (loading) {
        return <ChartPlaceholder title="Revenue By Plan" />;
    }

    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-80">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Revenue By Plan</h3>
            <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                            border: '1px solid #ccc',
                            color: '#333'
                        }} 
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueByPlanChart;