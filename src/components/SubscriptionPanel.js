import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { CreditCard } from 'lucide-react';

const SubscriptionPanel = ({ user, userData }) => {
    const [propertyCount, setPropertyCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const subscription = userData?.subscription;

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "properties"), where("ownerId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPropertyCount(snapshot.size);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const ProgressBar = ({ value, max }) => {
        const percentage = max > 0 ? (value / max) * 100 : 0;
        return (
            <div>
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Properties Used</span>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{value} / {max}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        );
    };

    if (!subscription || subscription.status !== 'active') {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-500/30">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">No Active Subscription</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    You are currently on the free plan. Please contact support to upgrade.
                </p>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
             <div className="flex items-center mb-4">
                <CreditCard size={20} className="mr-3 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">My Subscription</h3>
            </div>
            <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-green-800 dark:text-green-200">{subscription.planName} Plan</p>
                        <p className="text-sm text-green-700 dark:text-green-300">Renews on: {subscription.renewalDate.toDate().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-2xl font-bold text-green-800 dark:text-green-200">${subscription.price}<span className="text-sm font-medium">/mo</span></p>
                    </div>
                </div>
                
                {loading ? <p>Loading usage...</p> : <ProgressBar value={propertyCount} max={subscription.propertyLimit || 0} />}

                <div className="pt-4 border-t dark:border-gray-700">
                    <button className="button-secondary w-full" disabled>Manage Subscription</button>
                    <p className="text-xs text-center text-gray-400 mt-2">Contact support to change your plan.</p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPanel;