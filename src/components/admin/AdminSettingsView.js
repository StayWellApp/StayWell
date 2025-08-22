import React from 'react';
import { db } from '../../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { SlidersHorizontal } from 'lucide-react';
import SubscriptionManager from './SubscriptionManager'; // Import the new component

const ALL_FEATURES = [
    { id: 'advancedAnalytics', label: 'Enable Advanced Analytics' },
    { id: 'apiAccess', label: 'Enable API Access' },
    { id: 'automationModule', label: 'Enable Automation Module' },
];

const AdminSettingsView = () => {
    const [flags, setFlags] = React.useState({});
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchGlobalFlags = async () => {
            const settingsRef = doc(db, 'appSettings', 'featureFlags');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                setFlags(docSnap.data());
            }
            setLoading(false);
        };
        fetchGlobalFlags();
    }, []);

    const handleFlagChange = async (flagId) => {
        const newFlags = { ...flags, [flagId]: !flags[flagId] };
        setFlags(newFlags);

        const toastId = toast.loading("Updating global flags...");
        try {
            const settingsRef = doc(db, 'appSettings', 'featureFlags');
            await setDoc(settingsRef, newFlags, { merge: true });
            toast.update(toastId, { render: "Global flags updated!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Error updating global flags:", error);
            toast.update(toastId, { render: "Failed to update flags.", type: "error", isLoading: false, autoClose: 5000 });
        }
    };
    
    if (loading) {
        return <div className="p-8">Loading settings...</div>
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-8">
             <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Settings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage global application settings, feature flags, and subscription plans.</p>
            </header>

            {/* Subscription Manager */}
            <SubscriptionManager />

            {/* Global Feature Flags */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center mb-4">
                    <SlidersHorizontal size={20} className="mr-3 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Global Feature Flags</h3>
                </div>
                 <div className="space-y-3">
                    {ALL_FEATURES.map((feature) => (
                        <div key={feature.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!flags[feature.id]}
                                    onChange={() => handleFlagChange(feature.id)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsView;