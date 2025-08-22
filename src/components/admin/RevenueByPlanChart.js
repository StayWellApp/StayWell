import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const RevenueByPlanChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "users"), where("subscription.status", "==", "active"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const planRevenue = {};
            
            snapshot.forEach(doc => {
                const user = doc.data();
                const planName = user.subscription?.planName;
                const price = user.subscription?.price || 0;

                if (planName) {
                    if (planRevenue[planName]) {
                        planRevenue[planName] += price;
                    } else {
                        planRevenue[planName] = price;
                    }
                }
            });

            const chartData = Object.keys(planRevenue).map(planName => ({
                name: planName,
                value: planRevenue[planName],
            }));

            setData(chartData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                <DollarSign size={20} className="mr-3 text-green-500" />
                MRR by Subscription Plan
            </h3>
            {loading ? <p>Loading chart data...</p> : (
                 <ResponsiveContainer width="100%" height={300}>
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
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', backdropFilter: 'blur(4px)', border: '1px solid #4b5563', borderRadius: '0.75rem' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default RevenueByPlanChart;