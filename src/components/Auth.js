// src/components/Auth.js

import React, { useContext, useState, useEffect } from "react";
import { auth, googleProvider, db } from "../firebase-config";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { Mail, Lock, Building2, User, Phone, Globe, Sun, Moon } from 'lucide-react';

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

  async function login(email, password) {
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
// SVG Icons
const GoogleIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" {...props}><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" /><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.657-3.356-11.303-7.918l-6.522 5.025C9.505 39.556 16.227 44 24 44z" /><path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.417 44 30.638 44 24c0-1.341-.138-2.65-.389-3.917z" /></svg>
);
const MicrosoftIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" className="h-5 w-5" {...props}><path fill="#f25022" d="M1 1h9v9H1z" /><path fill="#00a4ef" d="M1 11h9v9H1z" /><path fill="#7fba00" d="M11 1h9v9h-9z" /><path fill="#ffb900" d="M11 11h9v9h-9z" /></svg>
);
// Helper Components
const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const toggleTheme = () => {
        setIsDark(prev => {
            document.documentElement.classList.toggle('dark', !prev);
            return !prev;
        });
    };
    return (
        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    );
};
const InputField = React.memo(({ id, type, placeholder, value, onChange, icon: Icon }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input id={id} name={id} type={type} required
            className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={placeholder} value={value} onChange={onChange}
        />
    </div>
));
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
  const handleAuthAction = async (authFn, email) => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);
    try {
      await authFn();
    } catch (error) {
      if (error.code === 'auth/user-disabled') {
        const suspendedUserDocRef = doc(db, 'suspendedUsers', email);
        const suspendedUserDoc = await getDoc(suspendedUserDocRef);
        if (suspendedUserDoc.exists()) {
          const { suspensionReason } = suspendedUserDoc.data();
          let message = 'Your account has been suspended.';
          if (suspensionReason) {
            message += ` Reason: ${suspensionReason}`;
          }
          setErrorMessage(message);
        } else {
          setErrorMessage('Your account is disabled. Please contact support.');
        }
      } else {
        setErrorMessage(error.message.replace('Firebase: ', ''));
      }
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
      handleAuthAction(() => login(email, password), email);
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
    const { email, password, companyName, fullName, phone, country } = formState;
    switch (view) {
        case 'forgotPassword':
            return (
                <>
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Enter your email to receive a reset link.</p>
                    </div>
                    <form className="space-y-5" onSubmit={handleForgotPassword}>
                        <InputField id="email" type="email" placeholder="Email Address" value={email} onChange={handleInputChange} icon={Mail} />
                                                <p className="text-sm text-center text-green-600 dark:text-green-400 min-h-[20px]">{successMessage}</p>
                                                <p className="text-sm text-center text-red-600 dark:text-red-400 min-h-[20px]">{errorMessage}</p>
                        <div>
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>
                    <div className="mt-8 text-sm text-center">
                        <button onClick={() => switchView('signIn')} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                            Back to Sign In
                        </button>
                    </div>
                </>
            );
        case 'signUp':
            return (
                <>
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Your Account</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Let's get you started.</p>
                    </div>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <InputField id="companyName" type="text" placeholder="Company Name" value={companyName} onChange={handleInputChange} icon={Building2} />
                        <InputField id="fullName" type="text" placeholder="Full Name" value={fullName} onChange={handleInputChange} icon={User} />
                        <InputField id="email" type="email" placeholder="Email Address" value={email} onChange={handleInputChange} icon={Mail} />
                        <InputField id="phone" type="tel" placeholder="Phone Number" value={phone} onChange={handleInputChange} icon={Phone} />
                        <InputField id="country" type="text" placeholder="Country" value={country} onChange={handleInputChange} icon={Globe} />
                        <p className="text-sm text-center text-red-600 dark:text-red-400 min-h-[20px]">{errorMessage}</p>
                        <div className="pt-2">
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                {isLoading ? 'Processing...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                    <div className="mt-8 text-sm text-center">
                        <button onClick={() => switchView('signIn')} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                            Already have an account? Sign In
                        </button>
                    </div>
                </>
            );
        default: // 'signIn'
            return (
                <>
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome Back</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Please enter your details to sign in.</p>
                    </div>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <InputField id="email" type="email" placeholder="Email Address" value={email} onChange={handleInputChange} icon={Mail} />
                        <div>
                            <InputField id="password" type="password" placeholder="Password" value={password} onChange={handleInputChange} icon={Lock} />
                            <div className="text-right mt-2">
                                <button type="button" onClick={() => switchView('forgotPassword')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                                    Forgot password?
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-center text-red-600 dark:text-red-400 min-h-[20px]">{errorMessage}</p>
                        <div className="pt-2">
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                {isLoading ? 'Processing...' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                    <div className="mt-6">
                        <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or</span></div></div>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button onClick={handleSignInWithGoogle} disabled={isLoading} className="w-full inline-flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"><GoogleIcon /><span className="ml-3">Google</span></button>
                            <button onClick={() => alert('Microsoft sign-in coming soon!')} disabled={isLoading} className="w-full inline-flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"><MicrosoftIcon /><span className="ml-3">Microsoft</span></button>
                        </div>
                    </div>
                    <div className="mt-8 text-sm text-center">
                        <button onClick={() => switchView('signUp')} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                            Don't have an account? Sign Up
                        </button>
                    </div>
                </>
            );
    }
  };
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex relative overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 via-sky-200 to-purple-200 dark:from-gray-800 dark:via-indigo-900 dark:to-purple-900" />
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