import React, { createContext, useState, useContext, useCallback } from 'react';

const AdminContext = createContext(null);

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
    const [selectedClient, setSelectedClient] = useState(null);

    const selectClient = useCallback((client) => {
        setSelectedClient(client);
    }, []);

    const clearSelectedClient = useCallback(() => {
        setSelectedClient(null);
    }, []);

    const value = {
        selectedClient,
        selectClient,
        clearSelectedClient
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};