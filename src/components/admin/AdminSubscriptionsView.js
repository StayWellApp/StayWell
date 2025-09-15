import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { CreditCard, Edit, Trash2, MessageSquare, Users } from 'lucide-react';

const AdminSubscriptionsView = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(null);
    
    // Form State
    const [planName, setPlanName] = useState('');
    const [pricePerProperty, setPricePerProperty] = useState('');
    const [teamMemberLimit, setTeamMemberLimit] = useState('');
    const [features, setFeatures] = useState({
        chatAccess: false,
        advancedAnalytics: false,
        automationModule: false,
    });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'subscriptionPlans'), (snapshot) => {
            const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlans(plansData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setPlanName('');
        setPricePerProperty('');
        setTeamMemberLimit('');
        setFeatures({ chatAccess: false, advancedAnalytics: false, automationModule: false });
        setIsEditing(null);
    };

    const handleFeatureToggle = (featureId) => {
        setFeatures(prev => ({ ...prev, [featureId]: !prev[featureId] }));
    };

    const handleSavePlan = async (e) => {
        e.preventDefault();
        if (!planName || !pricePerProperty || !teamMemberLimit) {
            toast.error("Please provide a plan name, price, and team member limit.");
            return;
        }

        const planData = {
            // **FIX:** Changed 'name' to 'planName' to be consistent
            planName: planName,
            pricePerProperty: Number(pricePerProperty),
            teamMemberLimit: Number(teamMemberLimit),
            features: features,
        };

        const toastId = toast.loading(isEditing ? "Updating plan..." : "Creating plan...");
        try {
            if (isEditing) {
                await updateDoc(doc(db, 'subscriptionPlans', isEditing.id), planData);
            } else {
                await addDoc(collection(db, 'subscriptionPlans'), planData);
            }
            toast.update(toastId, { render: "Plan saved successfully!", type: "success", isLoading: false, autoClose: 3000 });
            resetForm();
        } catch (error) {
            console.error("Error saving plan:", error);
            toast.update(toastId, { render: "Failed to save plan.", type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const handleEdit = (plan) => {
        setIsEditing(plan);
        // **FIX:** Use 'planName' when editing
        setPlanName(plan.planName);
        setPricePerProperty(plan.pricePerProperty);
        setTeamMemberLimit(plan.teamMemberLimit || 0);
        setFeatures(plan.features || { chatAccess: false, advancedAnalytics: false, automationModule: false });
    };

    const handleDelete = async (planId) => {
        if (window.confirm("Are you sure you want to delete this plan?")) {
            await deleteDoc(doc(db, 'subscriptionPlans', planId));
            toast.success("Plan deleted.");
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Manage Subscriptions</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage your feature-based subscription plans.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <form onSubmit={handleSavePlan} className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm space-y-4">
                        <h3 className="text-lg font-semibold">{isEditing ? 'Edit Plan' : 'Create New Plan'}</h3>
                        <div>
                            <label className="block text-sm font-medium">Plan Name</label>
                            <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} className="mt-1 input-style" placeholder="e.g., Business" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Price per Property (€/mo)</label>
                            <input type="number" value={pricePerProperty} onChange={e => setPricePerProperty(e.target.value)} className="mt-1 input-style" placeholder="e.g., 5" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Team Member Limit</label>
                            <input type="number" value={teamMemberLimit} onChange={e => setTeamMemberLimit(e.target.value)} className="mt-1 input-style" placeholder="e.g., 10" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Included Features</label>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={!!features.chatAccess} onChange={() => handleFeatureToggle('chatAccess')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                    <span className="text-sm">Chat Access</span>
                                </label>
                                 <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={!!features.automationModule} onChange={() => handleFeatureToggle('automationModule')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                    <span className="text-sm">Automation Module</span>
                                </label>
                                 <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={!!features.advancedAnalytics} onChange={() => handleFeatureToggle('advancedAnalytics')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                                    <span className="text-sm">Advanced Analytics</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex space-x-2 pt-2">
                            <button type="submit" className="button-primary w-full">{isEditing ? 'Update Plan' : 'Create Plan'}</button>
                            {isEditing && <button type="button" onClick={resetForm} className="button-secondary">Cancel</button>}
                        </div>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
                        <div className="space-y-3">
                            {loading ? <p>Loading...</p> : plans.map(plan => (
                                <div key={plan.id} className="p-4 rounded-lg border dark:border-gray-700">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {/* **FIX:** Use 'planName' when displaying */}
                                            <p className="font-semibold text-lg">{plan.planName}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                €{plan.pricePerProperty}/property/mo | Up to {plan.teamMemberLimit} team members
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                                            <button onClick={() => handleEdit(plan)} className="button-secondary-sm"><Edit size={14} /></button>
                                            <button onClick={() => handleDelete(plan.id)} className="button-danger-sm"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t dark:border-gray-600">
                                        <span className={`text-xs flex items-center ${plan.features?.chatAccess ? 'text-green-600' : 'text-gray-400 line-through'}`}><MessageSquare size={12} className="mr-1.5"/> Chat</span>
                                        <span className={`text-xs flex items-center ${plan.features?.automationModule ? 'text-green-600' : 'text-gray-400 line-through'}`}><Users size={12} className="mr-1.5"/> Automation</span>
                                        <span className={`text-xs flex items-center ${plan.features?.advancedAnalytics ? 'text-green-600' : 'text-gray-400 line-through'}`}><CreditCard size={12} className="mr-1.5"/> Analytics</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSubscriptionsView;