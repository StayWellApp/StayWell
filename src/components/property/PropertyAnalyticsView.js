// src/components/property/PropertyAnalyticsView.js
// This component displays the analytics view for a property.

import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const AnalyticsView = ({ property }) => {
    const data = [
        { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 },
        { name: 'Mar', revenue: 5000 }, { name: 'Apr', revenue: 4500 },
        { name: 'May', revenue: 6000 }, { name: 'Jun', revenue: 5500 },
    ];
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Revenue Analytics</h3>
            <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={data}>
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
                    <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }}/>
                    <Tooltip 
                        cursor={{fill: 'rgba(156, 163, 175, 0.1)'}}
                        contentStyle={{ 
                            backgroundColor: 'rgba(31, 41, 55, 0.8)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid #4b5563',
                            borderRadius: '0.75rem'
                        }}
                        labelStyle={{ color: '#d1d5db' }}
                    />
                    <Legend wrapperStyle={{ color: '#9ca3af' }} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
};
