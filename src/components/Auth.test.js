import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './Auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()), // Returns unsubscribe function
  GoogleAuthProvider: jest.fn(),
  initializeAuth: jest.fn(),
  indexedDBLocalPersistence: {},
  sendPasswordResetEmail: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(),
    serverTimestamp: jest.fn(() => 'mock-timestamp'),
  };
});

// Mock Firebase Config
jest.mock('../firebase-config', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

// Test Component to use Auth Context
const TestComponent = () => {
  const { signup, currentUser } = useAuth();

  const handleSignup = async () => {
    try {
      await signup('test@example.com', 'password123', {
        companyName: 'Test Company',
        fullName: 'Test User'
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div data-testid="user-email">{currentUser ? currentUser.email : 'No User'}</div>
      <button onClick={handleSignup}>Sign Up</button>
    </div>
  );
};

describe('Auth Component', () => {
  let createUserWithEmailAndPasswordMock;
  let setDocMock;
  let serverTimestampMock;
  let docMock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Mocks
    createUserWithEmailAndPasswordMock = require('firebase/auth').createUserWithEmailAndPassword;
    setDocMock = require('firebase/firestore').setDoc;
    serverTimestampMock = require('firebase/firestore').serverTimestamp;
    docMock = require('firebase/firestore').doc;

    createUserWithEmailAndPasswordMock.mockResolvedValue({
      user: {
        uid: 'test-uid-123',
        email: 'test@example.com',
      }
    });

    setDocMock.mockResolvedValue({});
    serverTimestampMock.mockReturnValue('mock-timestamp');
    docMock.mockReturnValue('mock-doc-ref');
  });

  test('signup creates user and sets correct role in Firestore', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const signupButton = screen.getByText('Sign Up');
    userEvent.click(signupButton);

    await waitFor(() => {
      expect(createUserWithEmailAndPasswordMock).toHaveBeenCalledWith(
        expect.anything(), // auth instance
        'test@example.com',
        'password123'
      );
    });

    await waitFor(() => {
      expect(setDocMock).toHaveBeenCalledWith(
        'mock-doc-ref', // doc ref
        expect.objectContaining({
          uid: 'test-uid-123',
          email: 'test@example.com',
          companyName: 'Test Company',
          fullName: 'Test User',
          role: 'owner', // Verify the role is explicitly set to 'owner'
          ownerId: 'test-uid-123',
          createdAt: 'mock-timestamp'
        })
      );
    });
  });
});
