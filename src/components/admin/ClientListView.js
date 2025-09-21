// src/components/admin/ClientListView.js

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Settings, Search, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

const ALL_COLUMNS = [
  { key: 'companyName', label: 'Company' },
  { key: 'fullName', label: 'Contact Name' },
  { key: 'email', label: 'Email' },
  { key: 'subscriptionTier', label: 'Plan' },
  { key: 'status', label: 'Status' },
  { key: 'subscriptionEndDate', label: 'Subscription Ends' },
  { key: 'country', label: 'Country' },
  { key: 'createdAt', label: 'Joined Date' },
];

const DEFAULT_COLUMNS = ['companyName', 'fullName', 'subscriptionTier', 'status', 'subscriptionEndDate', 'country'];

const ClientListView = ({ allClients, loading, onSelectClient, onAddClient }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'companyName', direction: 'ascending' });
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const storedColumns = localStorage.getItem('visibleClientColumns');
      const parsedColumns = storedColumns ? JSON.parse(storedColumns) : DEFAULT_COLUMNS;
      return Array.isArray(parsedColumns) ? parsedColumns : DEFAULT_COLUMNS;
    } catch (error) {
      return DEFAULT_COLUMNS;
    }
  });

  useEffect(() => {
    localStorage.setItem('visibleClientColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);


  const filteredAndSortedClients = useMemo(() => {
    let filteredClients = [...allClients];
    if (searchTerm) {
      filteredClients = filteredClients.filter(client =>
        Object.values(client).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (sortConfig.key) {
      filteredClients.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filteredClients;
  }, [allClients, sortConfig, searchTerm]);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const handleColumnToggle = (columnKey) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey) ? prev.filter(key => key !== columnKey) : [...prev, columnKey]
    );
  };
  
  const resetColumns = () => {
      setVisibleColumns(DEFAULT_COLUMNS);
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const renderCell = (client, columnKey) => {
    const cellValue = client[columnKey];
    switch (columnKey) {
      case 'companyName':
        return (
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 mr-4 flex-shrink-0">
                {client.companyName ? client.companyName.charAt(0) : '?'}
            </div>
            <span className="font-medium text-gray-900 dark:text-white">{cellValue}</span>
          </div>
        );
      case 'status':
        const statusColor = cellValue === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusColor}`}>{cellValue || 'Inactive'}</span>;
      case 'createdAt':
      case 'subscriptionEndDate':
        return cellValue?.seconds ? new Date(cellValue.seconds * 1000).toLocaleDateString() : 'N/A';
      case 'country':
        return client.country || 'N/A';
      default:
        return cellValue || 'N/A';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clients</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10">
                  <div className="flex justify-between items-center px-3 py-2 border-b dark:border-gray-600">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Visible Columns</div>
                      <button onClick={resetColumns} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center">
                          <RotateCcw className="h-3 w-3 mr-1"/> Reset
                      </button>
                  </div>
                  <div className="py-1">
                    {ALL_COLUMNS.map(col => (
                      <label key={col.key} className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                        <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500" checked={visibleColumns.includes(col.key)} onChange={() => handleColumnToggle(col.key)} />
                        <span className="ml-2">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {onAddClient && (
              <button onClick={onAddClient} className="flex items-center px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-1" /> Add Client
              </button>
            )}
          </div>
        </div>
        <div className="max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Search clients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
        </div>
      </div>
      <div className="overflow-x-auto flex-grow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {ALL_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                <th key={col.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(col.key)}>
                  <div className="flex items-center">{col.label}{getSortIcon(col.key)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={visibleColumns.length} className="text-center p-4">Loading clients...</td></tr>
            ) : filteredAndSortedClients.length === 0 ? (
              <tr><td colSpan={visibleColumns.length} className="text-center p-4">No clients found.</td></tr>
            ) : (
              filteredAndSortedClients.map((client) => (
                <tr key={client.id} onClick={() => onSelectClient && onSelectClient(client)} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  {ALL_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {renderCell(client, col.key)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientListView;