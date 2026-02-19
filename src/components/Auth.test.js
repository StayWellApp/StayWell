
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Auth, AuthProvider } from './Auth';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    onAuthStateChanged
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    onAuthStateChanged: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    initializeAuth: jest.fn(),
    indexedDBLocalPersistence: {},
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(),
    serverTimestamp: jest.fn(),
}));

// Mock firebase-config
jest.mock('../firebase-config', () => ({
    auth: { currentUser: null },
    db: {},
    googleProvider: {},
}));

describe('Auth Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation for onAuthStateChanged to immediately call callback with null (no user)
        onAuthStateChanged.mockImplementation((auth, callback) => {
            callback(null);
            return jest.fn(); // unsubscribe function
        });

        // Mock doc to return a reference
        doc.mockReturnValue({ id: 'mock-doc-ref' });

        // Mock serverTimestamp
        serverTimestamp.mockReturnValue('mock-timestamp');
    });

    const renderAuth = () => {
        return render(
            <AuthProvider>
                <Auth />
            </AuthProvider>
        );
    };

    test('renders login form by default', async () => {
        await act(async () => {
            renderAuth();
        });

        expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    test('login with valid credentials calls signInWithEmailAndPassword', async () => {
        signInWithEmailAndPassword.mockResolvedValue({ user: { uid: '123', email: 'test@example.com' } });

        await act(async () => {
            renderAuth();
        });

        const emailInput = screen.getByPlaceholderText(/Email Address/i);
        const passwordInput = screen.getByPlaceholderText(/Password/i);
        const signInButton = screen.getByRole('button', { name: /Sign In/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        await act(async () => {
            fireEvent.click(signInButton);
        });

        expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
    });

    test('login failure displays error message', async () => {
        const errorMessage = 'Invalid credentials';
        signInWithEmailAndPassword.mockRejectedValue(new Error(`Firebase: ${errorMessage}`));

        await act(async () => {
            renderAuth();
        });

        fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'wrongpassword' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
        });

        expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    });

    test('switches to sign up view', async () => {
        await act(async () => {
            renderAuth();
        });

        const signUpLink = screen.getByText(/Don't have an account\? Sign Up/i);

        await act(async () => {
            fireEvent.click(signUpLink);
        });

        expect(screen.getByText(/Create Your Account/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Company Name/i)).toBeInTheDocument();
    });

    test('sign up calls createUserWithEmailAndPassword and setDoc', async () => {
        const user = { uid: '123', email: 'new@example.com' };
        createUserWithEmailAndPassword.mockResolvedValue({ user });
        setDoc.mockResolvedValue();

        await act(async () => {
            renderAuth();
        });

        // Switch to Sign Up
        await act(async () => {
            fireEvent.click(screen.getByText(/Don't have an account\? Sign Up/i));
        });

        // Fill form
        fireEvent.change(screen.getByPlaceholderText(/Company Name/i), { target: { value: 'Test Co' } });
        fireEvent.change(screen.getByPlaceholderText(/Full Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'new@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/Phone Number/i), { target: { value: '1234567890' } });
        fireEvent.change(screen.getByPlaceholderText(/Country/i), { target: { value: 'USA' } });
        fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });

        const createAccountButton = screen.getByRole('button', { name: /Create Account/i });

        await act(async () => {
            fireEvent.click(createAccountButton);
        });

        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'new@example.com', 'password123');

        // Verify setDoc was called with user data
        expect(setDoc).toHaveBeenCalledWith(
            expect.anything(), // doc ref mock
            expect.objectContaining({
                uid: '123',
                email: 'new@example.com',
                companyName: 'Test Co',
                fullName: 'John Doe',
                role: 'owner',
                createdAt: 'mock-timestamp'
            })
        );
    });

    test('google sign in calls signInWithPopup', async () => {
        signInWithPopup.mockResolvedValue({ user: { uid: '123' } });

        await act(async () => {
            renderAuth();
        });

        const googleButton = screen.getByRole('button', { name: /Google/i });

        await act(async () => {
            fireEvent.click(googleButton);
        });

        expect(signInWithPopup).toHaveBeenCalledTimes(1);
    });

    test('forgot password calls sendPasswordResetEmail', async () => {
        sendPasswordResetEmail.mockResolvedValue();

        await act(async () => {
            renderAuth();
        });

        // Switch to Forgot Password
        await act(async () => {
            fireEvent.click(screen.getByText(/Forgot password\?/i));
        });

        expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText(/Email Address/i), { target: { value: 'reset@example.com' } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));
        });

        expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'reset@example.com');
        expect(await screen.findByText(/Check your email/i)).toBeInTheDocument();
    });
});
