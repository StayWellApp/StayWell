// staywellapp/staywell/StayWell-6e0b065d1897040a210dff5b77aa1b9a56a8c92f/src/components/admin/CustomerGrowthChart.js
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import DashboardWidget from './DashboardWidget';
import { TrendingUp } from 'lucide-react';

const ChartPlaceholder = ({ title }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-md animate-pulse">
            <TrendingUp className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        </div>
    </div>
);

const CustomerGrowthChart = ({ clients, loading }) => {
    if (loading || !clients) {
        return <ChartPlaceholder title="Customer Growth" />;
    }

    // Process client data to get counts per month
    const monthlyData = clients
        .filter(c => c.createdAt && c.createdAt.toDate)
        .reduce((acc, client) => {
            const month = moment(client.createdAt.toDate()).format('YYYY-MM');
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});

    // Create a data structure for all 12 months of the current year
    const currentYear = new Date().getFullYear();
    const data = Array.from({ length: 12 }, (_, i) => {
        const monthMoment = moment({ year: currentYear, month: i });
        const monthKey = monthMoment.format('YYYY-MM');
        return {
            month: monthKey,
            customers: monthlyData[monthKey] || 0,
        };
    });

    return (
        <DashboardWidget title="Customer Growth">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                        dataKey="month" 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(tick) => moment(tick).format('MMM')} 
                    />
                    <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        width={30}
                        allowDecimals={false} 
                    />
                    <Tooltip />
                    <Area type="monotone" dataKey="customers" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
            </ResponsiveContainer>
        </DashboardWidget>
    );
};

export default CustomerGrowthChart;