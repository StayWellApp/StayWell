import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { DollarSign, TrendingUp, Users } from 'lucide-react';

const StatCard = ({ icon, title, value, color, description }) => {
    const colors = {
        green: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300',
        blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
    };
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
            </div>
            {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{description}</p>}
        </div>
    );
};


const BillingView = () => {
    const [mrr, setMrr] = useState(0);
    const [activeSubscriptions, setActiveSubscriptions] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "users"), where("subscription.status", "==", "active"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            let totalMrr = 0;
            querySnapshot.forEach(doc => {
                const user = doc.data();
                if (user.subscription && user.subscription.price) {
                    totalMrr += user.subscription.price;
                }
            });
            setMrr(totalMrr);
            setActiveSubscriptions(querySnapshot.size);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="p-8">Calculating financial metrics...</div>;
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Billing & Financials</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">A summary of your business's financial health.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    icon={<DollarSign size={24} />} 
                    title="Monthly Recurring Revenue (MRR)" 
                    value={`$${mrr.toFixed(2)}`} 
                    color="green"
                    description="The total monthly revenue from all active subscriptions."
                />
                <StatCard 
                    icon={<Users size={24} />} 
                    title="Active Subscriptions" 
                    value={activeSubscriptions} 
                    color="blue"
                    description="The number of clients with an active, paying plan."
                />
                 <StatCard 
                    icon={<TrendingUp size={24} />} 
                    title="Annual Run Rate (ARR)" 
                    value={`$${(mrr * 12).toFixed(2)}`} 
                    color="green"
                    description="Your MRR projected over a full year."
                />
            </div>
        </div>
    );
};

export default BillingView;