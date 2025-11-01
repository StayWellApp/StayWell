// staywellapp/staywell/StayWell-6e0b065d1897040a210dff5b77aa1b9a56a8c92f/src/components/admin/RevenueByPlanChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DashboardWidget from './DashboardWidget';
import { BarChart2 } from 'lucide-react';

const ChartPlaceholder = ({ title }) => (
    <DashboardWidget title={title}>
        <div className="h-full flex flex-col items-center justify-center animate-pulse">
            <BarChart2 className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        </div>
    </DashboardWidget>
);


const RevenueByPlanChart = ({ clients, loading }) => {
    if (loading || !clients) {
        return <ChartPlaceholder title="Revenue By Plan" />;
    }

    const revenueData = clients
        .filter(client => client.subscription && client.subscription.status === 'active' && client.subscription.planName)
        .reduce((acc, client) => {
            const planName = client.subscription.planName;
            const price = client.subscription.price || 0;

            if (!acc[planName]) {
                acc[planName] = { name: planName, revenue: 0 };
            }
            acc[planName].revenue += price;
            
            return acc;
        }, {});

    const data = Object.values(revenueData);

    return (
        <DashboardWidget title="Revenue By Plan">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={data}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip 
                        cursor={{fill: 'rgba(239, 246, 255, 0.5)'}}
                        formatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                    />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="revenue" fill="#4f46e5" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </DashboardWidget>
    );
};

export default RevenueByPlanChart;