import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { CreditCard, Plus, Trash2, Edit } from 'lucide-react';

const SubscriptionManager = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [planName, setPlanName] = useState('');
    const [price, setPrice] = useState('');
    const [propertyLimit, setPropertyLimit] = useState('');
    const [isEditing, setIsEditing] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'subscriptionPlans'), (snapshot) => {
            const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlans(plansData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSavePlan = async (e) => {
        e.preventDefault();
        if (!planName || !price || !propertyLimit) {
            toast.error("Please fill out all fields.");
            return;
        }

        const planData = {
            name: planName,
            price: Number(price),
            propertyLimit: Number(propertyLimit),
        };

        const toastId = toast.loading(isEditing ? "Updating plan..." : "Creating plan...");
        try {
            if (isEditing) {
                await updateDoc(doc(db, 'subscriptionPlans', isEditing.id), planData);
            } else {
                await addDoc(collection(db, 'subscriptionPlans'), planData);
            }
            toast.update(toastId, { render: "Plan saved successfully!", type: "success", isLoading: false, autoClose: 3000 });
            setPlanName('');
            setPrice('');
            setPropertyLimit('');
            setIsEditing(null);
        } catch (error) {
            console.error("Error saving plan:", error);
            toast.update(toastId, { render: "Failed to save plan.", type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const handleEdit = (plan) => {
        setIsEditing(plan);
        setPlanName(plan.name);
        setPrice(plan.price);
        setPropertyLimit(plan.propertyLimit);
    };

    const handleDelete = async (planId) => {
        if (window.confirm("Are you sure you want to delete this plan?")) {
            await deleteDoc(doc(db, 'subscriptionPlans', planId));
            toast.success("Plan deleted.");
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center mb-4">
                <CreditCard size={20} className="mr-3 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Subscription Plans</h3>
            </div>

            {/* Form for adding/editing plans */}
            <form onSubmit={handleSavePlan} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plan Name</label>
                    <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} className="mt-1 input-style" placeholder="e.g., Pro" />
                </div>
                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price ($/mo)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 input-style" placeholder="e.g., 99" />
                </div>
                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Property Limit</label>
                    <input type="number" value={propertyLimit} onChange={e => setPropertyLimit(e.target.value)} className="mt-1 input-style" placeholder="e.g., 50" />
                </div>
                <div className="col-span-1 flex space-x-2">
                    <button type="submit" className="button-primary w-full">{isEditing ? 'Update' : 'Add'}</button>
                    {isEditing && <button type="button" onClick={() => { setIsEditing(null); setPlanName(''); setPrice(''); setPropertyLimit(''); }} className="button-secondary w-full">Cancel</button>}
                </div>
            </form>

            {/* List of existing plans */}
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? <p>Loading plans...</p> : plans.map(plan => (
                    <li key={plan.id} className="py-3 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{plan.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">${plan.price}/month - Up to {plan.propertyLimit} properties</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => handleEdit(plan)} className="button-secondary-sm"><Edit size={14} /></button>
                            <button onClick={() => handleDelete(plan.id)} className="button-danger-sm"><Trash2 size={14} /></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SubscriptionManager;