// src/components/admin/ColumnManagerModal.js
import React, { useState, useEffect } from 'react';

const ColumnManagerModal = ({ isOpen, onClose, columns, visibleKeys, onSave }) => {
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [hiddenColumns, setHiddenColumns] = useState([]);

    useEffect(() => {
        const visible = columns.filter(col => visibleKeys[col.key]);
        const hidden = columns.filter(col => !visibleKeys[col.key]);
        setVisibleColumns(visible);
        setHiddenColumns(hidden);
    }, [isOpen, columns, visibleKeys]);

    const moveToVisible = (column) => {
        setHiddenColumns(hiddenColumns.filter(c => c.key !== column.key));
        setVisibleColumns([...visibleColumns, column]);
    };

    const moveToHidden = (column) => {
        setVisibleColumns(visibleColumns.filter(c => c.key !== column.key));
        setHiddenColumns([...hiddenColumns, column]);
    };

    const handleSave = () => {
        const newVisibleKeys = visibleColumns.reduce((acc, col) => {
            acc[col.key] = true;
            return acc;
        }, {});
        onSave(newVisibleKeys);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Manage Columns</h2>
                <div className="flex space-x-4">
                    <div className="w-1/2">
                        <h3 className="font-semibold mb-2">Visible Columns</h3>
                        <ul className="border rounded-lg p-2 min-h-[200px] dark:border-gray-600">
                            {visibleColumns.map(col => (
                                <li key={col.key} className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    {col.label}
                                    <button onClick={() => moveToHidden(col)} className="text-red-500 hover:text-red-700">Remove</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-1/2">
                        <h3 className="font-semibold mb-2">Hidden Columns</h3>
                        <ul className="border rounded-lg p-2 min-h-[200px] dark:border-gray-600">
                            {hiddenColumns.map(col => (
                                <li key={col.key} className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    {col.label}
                                    <button onClick={() => moveToVisible(col)} className="text-green-500 hover:text-green-700">Add</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded bg-blue-500 text-white">Save View</button>
                </div>
            </div>
        </div>
    );
};

export default ColumnManagerModal;