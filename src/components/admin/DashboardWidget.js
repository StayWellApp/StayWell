// staywellapp/staywell/StayWell-6e0b065d1897040a210dff5b77aa1b9a56a8c92f/src/components/admin/DashboardWidget.js
import React from 'react';

const DashboardWidget = ({ title, children, onViewAll, headerContent }) => {
  return (
    <div className="absolute top-2 right-2 bottom-2 left-2 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
        {headerContent && <div>{headerContent}</div>}
        {onViewAll && (
          <button onClick={onViewAll} className="text-sm text-blue-500 hover:underline">
            View All
          </button>
        )}
      </div>
      <div className="p-4 flex-grow overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardWidget;