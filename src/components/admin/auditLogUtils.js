import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const logAdminActionCallable = httpsCallable(functions, 'logAdminAction');

export const logAdminAction = async (message) => {
    try {
        await logAdminActionCallable({ message });
    } catch (error) {
        console.error("Failed to log admin action:", error);
        // We typically don't show an error toast for this,
        // as it's a background process.
    }
};