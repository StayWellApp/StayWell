import React from 'react';
import { X } from 'lucide-react';

const ManageWidgetsModal = ({ isOpen, onClose, widgets, visibleWidgets, onWidgetToggle }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all duration-300 scale-95 opacity-0 animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Widgets</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <div className="space-y-3">
                    {Object.keys(widgets).map(widgetKey => (
                        <label key={widgetKey} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <span className="text-gray-800 dark:text-gray-200 font-medium">{widgets[widgetKey].name}</span>
                            <input
                                type="checkbox"
                                className="form-checkbox h-5 w-5 text-indigo-600 rounded-md bg-gray-200 dark:bg-gray-600 border-transparent focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500"
                                checked={visibleWidgets.includes(widgetKey)}
                                onChange={() => onWidgetToggle(widgetKey)}
                            />
                        </label>
                    ))}
                </div>
            </div>
            {/* Add this to your tailwind.config.js if you don't have it */}
            <style jsx global>{`
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ManageWidgetsModal;