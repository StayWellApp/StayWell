// src/contexts/AdminContext.js

import React, { createContext, useState, useContext } from 'react';

const AdminContext = createContext();

export const useAdmin = () => {
    return useContext(AdminContext);
};

export const AdminProvider = ({ children }) => {
    const [selectedClient, setSelectedClient] = useState(null);

    const selectClient = (client) => {
        setSelectedClient(client);
    };

    const clearSelectedClient = () => {
        setSelectedClient(null);
    };

    const value = {
        selectedClient,
        selectClient,
        clearSelectedClient,
    };

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};