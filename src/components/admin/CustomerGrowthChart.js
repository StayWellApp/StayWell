import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

const CustomerGrowthChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get the date 6 months ago
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const sixMonthsAgoTimestamp = Timestamp.fromDate(sixMonthsAgo);

        const q = query(
            collection(db, "users"),
            where("role", "==", "owner"),
            where("createdAt", ">=", sixMonthsAgoTimestamp)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const signups = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    // Convert Firestore Timestamp to JavaScript Date
                    signupDate: data.createdAt?.toDate()
                };
            });
            
            // Process data to group by month
            const monthlyData = {};
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
                 const monthName = d.toLocaleString('default', { month: 'short' });
                monthlyData[monthKey] = { name: monthName, newCustomers: 0 };
            }

            signups.forEach(signup => {
                if (signup.signupDate) {
                    const monthKey = `${signup.signupDate.getFullYear()}-${String(signup.signupDate.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyData[monthKey]) {
                        monthlyData[monthKey].newCustomers += 1;
                    }
                }
            });

            setData(Object.values(monthlyData));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                <Users size={20} className="mr-3 text-blue-500" />
                New Customer Growth (Last 6 Months)
            </h3>
            {loading ? <p>Loading chart data...</p> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', backdropFilter: 'blur(4px)', border: '1px solid #4b5563', borderRadius: '0.75rem' }} />
                        <Legend />
                        <Bar dataKey="newCustomers" name="New Customers" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default CustomerGrowthChart;