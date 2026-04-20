import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AdminProvider, useAdmin } from '../AdminContext';

describe('AdminContext', () => {
    test('provides initial state', () => {
        const wrapper = ({ children }) => <AdminProvider>{children}</AdminProvider>;
        const { result } = renderHook(() => useAdmin(), { wrapper });

        expect(result.current.selectedClient).toBeNull();
    });

    test('updates selected client', () => {
        const wrapper = ({ children }) => <AdminProvider>{children}</AdminProvider>;
        const { result } = renderHook(() => useAdmin(), { wrapper });

        const client = { id: 1, name: 'Test Client' };

        act(() => {
            result.current.selectClient(client);
        });

        expect(result.current.selectedClient).toEqual(client);
    });

    test('clears selected client', () => {
        const wrapper = ({ children }) => <AdminProvider>{children}</AdminProvider>;
        const { result } = renderHook(() => useAdmin(), { wrapper });

        const client = { id: 1, name: 'Test Client' };

        act(() => {
            result.current.selectClient(client);
        });

        expect(result.current.selectedClient).toEqual(client);

        act(() => {
            result.current.clearSelectedClient();
        });

        expect(result.current.selectedClient).toBeNull();
    });

    test('returns null when used outside provider', () => {
        const { result } = renderHook(() => useAdmin());
        expect(result.current).toBeNull();
    });
});
