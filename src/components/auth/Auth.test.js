import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Auth } from '../Auth';
import { AuthProvider } from '../Auth';

// Mock Firebase
jest.mock('../../firebase-config', () => ({
  auth: {},
  googleProvider: {},
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()), // Returns unsubscribe function
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

describe('Auth Component', () => {
  test('renders login form by default', () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );
    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    // Using getAllByText because "Sign In" might appear in the button and the link to switch back
    // Actually the button text is "Sign In" or "Processing..."
    // The link text is "Already have an account? Sign In" (in sign up view)
    // In login view, button is "Sign In".
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  test('switches to sign up view', () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );

    // Find "Don't have an account? Sign Up" button
    const signUpButton = screen.getByText(/Don't have an account\? Sign Up/i);
    fireEvent.click(signUpButton);

    expect(screen.getByRole('heading', { name: /Create Your Account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Company Name/i)).toBeInTheDocument();
  });

  test('switches to forgot password view', () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );

    const forgotPasswordLink = screen.getByText(/Forgot password\?/i);
    fireEvent.click(forgotPasswordLink);

    expect(screen.getByRole('heading', { name: /Reset Password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
  });
});
