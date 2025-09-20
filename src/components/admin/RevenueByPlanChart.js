// src/components/admin/RevenueByPlanChart.js

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Dummy data
const data = [
    { name: 'Basic Plan', value: 400 },
    { name: 'Pro Plan', value: 300 },
    { name: 'Enterprise Plan', value: 200 },
];
const COLORS = ['#60a5fa', '#818cf8', '#4f46e5'];

const RevenueByPlanChart = ({ clients }) => {
    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-80">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Revenue By Plan</h3>
            <ResponsiveContainer width="100%" height="100%">
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
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueByPlanChart;