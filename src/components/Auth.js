// src/components/Auth.js

import React, { useContext, useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase-config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail // <-- ADDED: Import for password reset
} from "firebase/auth";
import { Mail, Lock } from 'lucide-react';

// --- Auth Context (No changes needed here) ---
const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function signInWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// --- SVG Icons (No changes needed here) ---
const GoogleIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" {...props}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.657-3.356-11.303-7.918l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.417 44 30.638 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);

const MicrosoftIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" className="h-5 w-5" {...props}>
        <path fill="#f25022" d="M1 1h9v9H1z"/>
        <path fill="#00a4ef" d="M1 11h9v9H1z"/>
        <path fill="#7fba00" d="M11 1h9v9h-9z"/>
        <path fill="#ffb900" d="M11 11h9v9h-9z"/>
    </svg>
);


// --- Auth Component (with Forgot Password) ---
export const Auth = () => {
  // ADDED: view state to switch between forms
  const [view, setView] = useState('signIn'); // 'signIn', 'signUp', 'forgotPassword'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // For success feedback
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, signInWithGoogle } = useAuth();

  const handleAuthAction = async (authFn) => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);
    try {
      await authFn();
    } catch (error) {
      setErrorMessage(error.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };
  
  // ADDED: Handler for the forgot password form
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    handleAuthAction(async () => {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage('Check your email for a password reset link.');
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const authFn = view === 'signUp' ? () => signup(email, password) : () => login(email, password);
    handleAuthAction(authFn);
  };
  
  const handleSignInWithGoogle = () => handleAuthAction(signInWithGoogle);

  const resetState = () => {
      setErrorMessage('');
      setSuccessMessage('');
      setEmail('');
      setPassword('');
  }

  const renderContent = () => {
    if (view === 'forgotPassword') {
      return (
        <>
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Enter your email to receive a reset link.</p>
          </div>
          <form className="space-y-5" onSubmit={handleForgotPassword}>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input id="email" name="email" type="email" autoComplete="email" required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            {successMessage && <p className="text-sm text-center text-green-600 dark:text-green-400">{successMessage}</p>}
            {errorMessage && <p className="text-sm text-center text-red-600 dark:text-red-400">{errorMessage}</p>}
            <div>
              <button type="submit" disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
          <div className="mt-8 text-sm text-center">
            <button onClick={() => { setView('signIn'); resetState(); }} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Back to Sign In
            </button>
          </div>
        </>
      );
    }

    // Default view: Sign In and Sign Up
    return (
      <>
        <div className="text-center lg:text-left mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {view === 'signUp' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {view === 'signUp' ? 'Get started with your new account.' : 'Please enter your details to sign in.'}
          </p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                <input id="email" name="email" type="email" autoComplete="email" required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                />
            </div>
          </div>
          {/* Password Input */}
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input id="password" name="password" type="password" autoComplete="current-password" required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                />
            </div>
          </div>

          {/* ADDED: Forgot password link */}
          {view === 'signIn' && (
            <div className="flex items-center justify-end">
                <div className="text-sm">
                    <button type="button" onClick={() => { setView('forgotPassword'); resetState(); }} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                        Forgot password?
                    </button>
                </div>
            </div>
          )}

          {errorMessage && <p className="text-sm text-center text-red-600 dark:text-red-400">{errorMessage}</p>}
          <div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
              {isLoading ? 'Processing...' : (view === 'signUp' ? 'Create Account' : 'Sign In')}
            </button>
          </div>
        </form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or</span></div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={handleSignInWithGoogle} disabled={isLoading} className="w-full inline-flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
              <GoogleIcon /><span className="ml-3">Google</span>
            </button>
            <button onClick={() => alert('Microsoft sign-in coming soon!')} disabled={isLoading} className="w-full inline-flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
              <MicrosoftIcon /><span className="ml-3">Microsoft</span>
            </button>
          </div>
        </div>
        <div className="mt-8 text-sm text-center">
          <button type="button" onClick={() => { setView(view === 'signIn' ? 'signUp' : 'signIn'); resetState(); }} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            {view === 'signIn' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex w-1/2 bg-gray-50 dark:bg-gray-800 items-center justify-center p-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">StayWell</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Management, simplified. Welcome back.</p>
        </div>
      </div>
      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};