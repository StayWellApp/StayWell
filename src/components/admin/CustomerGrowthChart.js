// src/components/admin/CustomerGrowthChart.js

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';

const CustomerGrowthChart = ({ clients }) => {
    const data = clients
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
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="newClients" fill="#4f46e5" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CustomerGrowthChart;