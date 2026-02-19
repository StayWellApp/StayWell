// src/components/Auth.js

import React, { useContext, useState, useEffect } from "react";
import { auth, googleProvider, db } from "../firebase-config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { Globe } from 'lucide-react';
import ThemeToggle from './common/ThemeToggle';
import LoginForm from './auth/LoginForm';
import SignupForm from './auth/SignupForm';
import ForgotPasswordForm from './auth/ForgotPasswordForm';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- FIX: Assigns role: "owner" instead of roles: ["client_admin"] ---
  async function signup(email, password, additionalData) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        ...additionalData,
        role: "owner", // Correct role assignment
        createdAt: serverTimestamp(),
        ownerId: user.uid,
      });
    }
    return userCredential;
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

  const value = { currentUser, loading, login, signup, logout, signInWithGoogle };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ... (rest of the Auth.js file remains the same)
// Main Auth Component
export const Auth = () => {
  const [view, setView] = useState('signIn');
  const [formState, setFormState] = useState({
      email: "", password: "", companyName: "", fullName: "", phone: "", country: ""
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup, signInWithGoogle } = useAuth();
  const handleInputChange = (e) => {
      const { id, value } = e.target;
      setFormState(prev => ({ ...prev, [id]: value }));
  };
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
  const handleForgotPassword = (e) => {
    e.preventDefault();
    handleAuthAction(async () => {
      await sendPasswordResetEmail(auth, formState.email);
      setSuccessMessage('Check your email for a password reset link.');
    });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const { email, password, companyName, fullName, phone, country } = formState;
    if (view === 'signUp') {
      const additionalData = { companyName, fullName, phone, country, displayName: fullName };
      handleAuthAction(() => signup(email, password, additionalData));
    } else {
      handleAuthAction(() => login(email, password));
    }
  };
  const handleSignInWithGoogle = () => handleAuthAction(signInWithGoogle);
  const switchView = (newView) => {
      setErrorMessage('');
      setSuccessMessage('');
      setFormState(prev => ({
          ...{ email: "", password: "", companyName: "", fullName: "", phone: "", country: "" },
          email: newView === 'forgotPassword' ? prev.email : ""
      }));
      setView(newView);
  };
  const renderForm = () => {
    switch (view) {
        case 'forgotPassword':
            return (
                <ForgotPasswordForm
                    formState={formState}
                    handleInputChange={handleInputChange}
                    handleForgotPassword={handleForgotPassword}
                    errorMessage={errorMessage}
                    successMessage={successMessage}
                    isLoading={isLoading}
                    switchView={switchView}
                />
            );
        case 'signUp':
            return (
                <SignupForm
                    formState={formState}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    errorMessage={errorMessage}
                    isLoading={isLoading}
                    switchView={switchView}
                />
            );
        default: // 'signIn'
            return (
                <LoginForm
                    formState={formState}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    errorMessage={errorMessage}
                    isLoading={isLoading}
                    switchView={switchView}
                    handleSignInWithGoogle={handleSignInWithGoogle}
                />
            );
    }
  };
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex relative">
      <div className="absolute top-6 right-6 flex items-center space-x-4 z-10">
        <ThemeToggle />
        <div className="relative">
          <select className="appearance-none bg-gray-200 dark:bg-gray-700 border-none rounded-full py-2 pl-4 pr-8 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option>English</option><option>Español</option><option>Français</option>
          </select>
          <Globe className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400" />
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 via-sky-200 to-purple-200 dark:from-gray-800 dark:via-indigo-900 dark:to-purple-900 animate-gradient-xy" />
        <div className="text-center z-10">
          <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">StayWell</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Management, simplified.</p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {renderForm()}
        </div>
      </div>
    </div>
  );
};