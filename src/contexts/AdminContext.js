import React, { useState, useContext, useCallback } from 'react';

const AdminContext = React.createContext();

export function useAdmin() {
    return useContext(AdminContext);
}

export function AdminProvider({ children }) {
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
        clearSelectedClient,
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
}