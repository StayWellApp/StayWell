import React from 'react';
import { getAuth } from 'firebase/auth';
import ClientSubscriptionManager from '../ClientSubscriptionManager';
import { UserSearch, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const ManagementTab = ({ client, refreshClientData, allPlans, loadingPlans, onImpersonate }) => {
    
    if (!client) {
        return <div>Loading management details...</div>;
    }

import React from 'react';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import ClientSubscriptionManager from '../ClientSubscriptionManager';
import { UserSearch, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const ManagementTab = ({ client, refreshClientData, allPlans, loadingPlans, onImpersonate }) => {
    
    if (!client) {
        return <div>Loading management details...</div>;
    }

    const handleActionClick = async (action) => {
        if (action === 'Reset Data') {
            if (window.confirm(`Are you sure you want to reset all data for ${client.companyName}? This action cannot be undone.`)) {
                const toastId = toast.loading("Resetting client data...");
                try {
                    const functions = getFunctions();
                    const resetClientData = httpsCallable(functions, 'resetClientData');
                    await resetClientData({ clientId: client.id });
                    toast.update(toastId, { render: "Client data reset successfully!", type: "success", isLoading: false, autoClose: 3000 });
                    refreshClientData();
                } catch (error) {
                    console.error("Error resetting client data:", error);
                    toast.update(toastId, { render: `Error resetting data: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
                }
            }
        } else if (action === 'Suspend Account') {
            const suspend = !client.disabled;
            if (window.confirm(`Are you sure you want to ${suspend ? 'suspend' : 'unsuspend'} ${client.companyName}?`)) {
                const toastId = toast.loading(`${suspend ? 'Suspending' : 'Unsuspending'} client...`);
                try {
                    const functions = getFunctions();
                    const suspendClient = httpsCallable(functions, 'suspendClient');
                    await suspendClient({ clientId: client.id, suspend });
                    toast.update(toastId, { render: `Client ${suspend ? 'suspended' : 'unsuspended'} successfully!`, type: "success", isLoading: false, autoClose: 3000 });
                    refreshClientData();
                } catch (error) {
                    console.error("Error suspending client:", error);
                    toast.update(toastId, { render: `Error suspending client: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
                }
            }
        } else if (action === 'Delete Account') {
            if (window.confirm(`Are you sure you want to delete the account for ${client.companyName}? This action is permanent and cannot be undone.`)) {
                const toastId = toast.loading("Deleting client account...");
                try {
                    const functions = getFunctions();
                    const deleteClient = httpsCallable(functions, 'deleteClient');
                    await deleteClient({ clientId: client.id });
                    toast.update(toastId, { render: "Client account deleted successfully!", type: "success", isLoading: false, autoClose: 3000 });
                    // After deletion, you might want to redirect the user or refresh the client list
                } catch (error) {
                    console.error("Error deleting client:", error);
                    toast.update(toastId, { render: `Error deleting client: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
                }
            }
        } else {
            console.log(`${action} button clicked for client: ${client.id}. Functionality not yet implemented.`);
            toast.warn(`${action} functionality is not yet implemented.`);
        }
    };

    const handleExportData = async () => {
        const toastId = toast.loading("Exporting client data...");
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                throw new Error("You must be logged in to perform this action.");
            }
            const idToken = await user.getIdToken();

            const response = await fetch('https://us-central1-staywellapp-49b62.cloudfunctions.net/exportClientData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ data: { clientId: client.id } })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to export data.');
            }

            const result = await response.json();
            
            const dataStr = JSON.stringify(result.data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `${client.id}_export.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            toast.update(toastId, { render: "Data exported successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Error exporting data:", error);
            toast.update(toastId, { render: `Error exporting data: ${error.message}`, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const Card = ({ children, title, icon: Icon, className = '' }) => (
        <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg ${className}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                {Icon && <Icon className="h-5 w-5 text-gray-400 mr-3" />}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Subscription Management">
                    <ClientSubscriptionManager 
                        client={client} 
                        onSubscriptionUpdate={refreshClientData} 
                        allPlans={allPlans} 
                        loadingPlans={loadingPlans} 
                    />
                </Card>
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border-2 border-red-500/30 dark:border-red-500/50">
                    <div className="p-4 border-b border-red-500/30 dark:border-red-500/50 flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <button onClick={() => handleActionClick('Reset Data')} className="button-outline-danger w-full">Reset Data</button>
                            <p className="text-xs text-gray-500 mt-1">Delete all data but keep the account.</p>
                        </div>
                        <div className="text-center">
                            <button onClick={() => handleActionClick('Suspend Account')} className="button-outline-danger w-full">Suspend Account</button>
                            <p className="text-xs text-gray-500 mt-1">Temporarily disable the client's account.</p>
                        </div>
                        <div className="text-center">
                            <button onClick={() => handleActionClick('Delete Account')} className="button-danger w-full">Delete Account</button>
                            <p className="text-xs text-gray-500 mt-1">This action is permanent.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card title="Admin Actions">
                    <button onClick={() => onImpersonate(client)} className="button-secondary w-full">Impersonate User</button>
                    <p className="text-xs text-center mt-1 text-gray-500">Log in as this user to troubleshoot.</p>
                </Card>
                <Card title="Data Management">
                    <button onClick={handleExportData} className="button-secondary w-full">Export Client Data</button>
                    <p className="text-xs text-center mt-1 text-gray-500">Download all of the client's data.</p>
                </Card>
            </div>
        </div>
    );
};

export default ManagementTab;