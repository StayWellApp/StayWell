import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

const RevenueByPlanChart = ({ clients }) => {
    // NOTE: This logic assumes clients have a subscriptionTier and a subscription.price
    const data = clients.reduce((acc, client) => {
        const plan = client.subscriptionTier || 'Unknown';
        const price = client.subscription?.price || 0;
        
        const existingPlan = acc.find(p => p.name === plan);
        if (existingPlan) {
            existingPlan.value += price;
        } else {
            acc.push({ name: plan, value: price });
        }
        return acc;
    }, []);

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-full flex flex-col">
             <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-blue-500" />
                Revenue by Plan
            </h3>
            <div className="flex-grow">
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
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueByPlanChart;