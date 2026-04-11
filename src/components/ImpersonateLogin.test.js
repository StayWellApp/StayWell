import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { getAuth, setPersistence, signInWithCustomToken } from 'firebase/auth';
import ImpersonateLogin from './ImpersonateLogin';

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    setPersistence: jest.fn(),
    browserSessionPersistence: 'session',
    signInWithCustomToken: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

describe('ImpersonateLogin', () => {
    const mockNavigate = jest.fn();
    const mockAuth = {};

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        getAuth.mockReturnValue(mockAuth);
        sessionStorage.clear();
    });

    test('redirects to / if no token is found', () => {
        render(
            <MemoryRouter>
                <ImpersonateLogin />
            </MemoryRouter>
        );

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('signs in and redirects on success', async () => {
        sessionStorage.setItem('impersonationToken', 'fake-token');
        setPersistence.mockResolvedValue();
        signInWithCustomToken.mockResolvedValue();

        render(
            <MemoryRouter>
                <ImpersonateLogin />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(setPersistence).toHaveBeenCalledWith(mockAuth, 'session');
            expect(signInWithCustomToken).toHaveBeenCalledWith(mockAuth, 'fake-token');
            expect(sessionStorage.getItem('impersonationToken')).toBeNull();
            expect(sessionStorage.getItem('isImpersonating')).toBe('true');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    test('renders error message safely on failure', async () => {
        const errorMessage = '<img src=x onerror=alert(1)> Failed';
        sessionStorage.setItem('impersonationToken', 'fake-token');
        setPersistence.mockResolvedValue();
        signInWithCustomToken.mockRejectedValue(new Error(errorMessage));

        render(
            <MemoryRouter>
                <ImpersonateLogin />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Impersonation Failed')).toBeInTheDocument();
            // This verifies that the error message is rendered as text, not as HTML
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(sessionStorage.getItem('impersonationToken')).toBeNull();
        });
    });
});
