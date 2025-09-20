// src/components/admin/DashboardWidgetWrapper.js

import React from 'react';
import { GripVertical, X } from 'lucide-react';

const DashboardWidgetWrapper = ({ children, title, isEditing, onRemoveWidget }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md h-full flex flex-col">
            {isEditing && (
                <div className="relative p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <button className="drag-handle cursor-move text-gray-400 hover:text-gray-600">
                        <GripVertical className="h-5 w-5" />
                    </button>
                    <p className="text-xs font-bold text-gray-500 uppercase">{title}</p>
                    <button 
                        onClick={onRemoveWidget}
                        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 rounded-full"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            <div className="flex-grow p-4 overflow-hidden">
                {children}
            </div>
        </div>
    );
};

export default DashboardWidgetWrapper;