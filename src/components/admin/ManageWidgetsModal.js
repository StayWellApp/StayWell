// src/components/admin/ManageWidgetsModal.js

import React from 'react';

const ManageWidgetsModal = ({ isOpen, onClose, allWidgets, visibleWidgets, onVisibilityChange }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Manage Widgets</h2>
                <div className="space-y-3">
                    {allWidgets.map(widget => (
                        <div key={widget.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{widget.name}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={visibleWidgets.includes(widget.id)}
                                    onChange={() => onVisibilityChange(widget.id)}
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageWidgetsModal;