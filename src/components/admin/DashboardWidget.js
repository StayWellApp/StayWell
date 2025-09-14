// src/components/admin/DashboardWidget.js
import React from 'react';
import { GripVertical } from 'lucide-react';

const DashboardWidget = React.forwardRef(({ children, title, showDragHandle = true }, ref) => {
    return (
        <div 
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col" 
            ref={ref}
        >
            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
                {showDragHandle && (
                    <div className="drag-handle cursor-move text-gray-400">
                        <GripVertical size={20} />
                    </div>
                )}
            </div>
            <div className="p-4 flex-grow overflow-auto">
                {children}
            </div>
        </div>
    );
});

export default DashboardWidget;