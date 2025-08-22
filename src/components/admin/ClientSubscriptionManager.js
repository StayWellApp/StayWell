import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { logAdminAction } from './auditLogUtils';

const ClientSubscriptionManager = ({ client }) => {
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(client.subscription?.planId || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'subscriptionPlans'), (snapshot) => {
            const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlans(plansData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSubscriptionChange = async (e) => {
        const newPlanId = e.target.value;
        setSelectedPlanId(newPlanId);

        const selectedPlan = plans.find(p => p.id === newPlanId);
        if (!selectedPlan && newPlanId !== '') {
            toast.error("Selected plan not found.");
            return;
        }

        const toastId = toast.loading("Updating client subscription...");
        try {
            const clientDocRef = doc(db, 'users', client.id);
            
            const renewalDate = new Date();
            renewalDate.setDate(renewalDate.getDate() + 30);

            const newSubscriptionData = newPlanId ? {
                planId: selectedPlan.id,
                planName: selectedPlan.name,
                pricePerProperty: selectedPlan.pricePerProperty,
                teamMemberLimit: selectedPlan.teamMemberLimit,
                features: selectedPlan.features,
                status: 'active',
                assignedAt: Timestamp.now(),
                renewalDate: Timestamp.fromDate(renewalDate),
            } : null;

            await updateDoc(clientDocRef, {
                subscription: newSubscriptionData
            });
            
            const message = newPlanId
                ? `Assigned plan "${selectedPlan.name}" to client ${client.email}.`
                : `Removed subscription from client ${client.email}.`;
            await logAdminAction(message);

            toast.update(toastId, { render: "Subscription updated!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Error updating subscription:", error);
            toast.update(toastId, { render: "Failed to update subscription.", type: "error", isLoading: false, autoClose: 5000 });
            setSelectedPlanId(client.subscription?.planId || '');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Manage Subscription</h3>
            {loading ? <p>Loading plans...</p> : (
                <div>
                    <label htmlFor="plan-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Plan</label>
                    <select
                        id="plan-select"
                        value={selectedPlanId}
                        onChange={handleSubscriptionChange}
                        className="mt-1 input-style w-full"
                    >
                        <option value="">None (Trial/Suspended)</option>
                        {plans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                                {plan.name} (€{plan.pricePerProperty}/property)
                            </option>
                        ))}
                    </select>
                </div>
            )}
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Assigning a plan will grant the client access based on its features and limits.</p>
        </div>
    );
};

export default ClientSubscriptionManager;