import React, { useState } from 'react';

const SuspendClientModal = ({ isOpen, onClose, onConfirm }) => {
    const [duration, setDuration] = useState('indefinite');
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({ duration, reason });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Suspend Client Account</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Suspension Duration</label>
                        <select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="indefinite">Indefinite</option>
                            <option value="1">1 Day</option>
                            <option value="7">7 Days</option>
                            <option value="30">30 Days</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for Suspension</label>
                        <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows="3" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"></textarea>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="button-secondary">Cancel</button>
                    <button onClick={handleConfirm} className="button-danger">Suspend</button>
                </div>
            </div>
        </div>
    );
};

export default SuspendClientModal;