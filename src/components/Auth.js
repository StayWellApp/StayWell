// src/components/Auth.js
import React, { useState } from 'react';
import { auth } from '../firebase-config';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail // Import the password reset function
} from 'firebase/auth';
import { toast } from 'react-toastify';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // --- NEW: State for login errors and loading ---
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // --- NEW: State to toggle between Login and Forgot Password views ---
    const [view, setView] = useState('login'); // 'login' or 'forgotPassword'

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(''); // Clear previous errors
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // On successful login, App.js will handle the redirect.
            toast.success("Logged in successfully!");
        } catch (err) {
            // --- NEW: User-friendly error handling ---
            console.error("Login error:", err.code);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password. Please try again.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('An unexpected error occurred. Please try again later.');
            }
        }
        setLoading(false);
    };

    // --- NEW: Function to handle password reset ---
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success(`Password reset link sent to ${email}. Please check your inbox.`);
            setView('login'); // Switch back to login view after sending
        } catch (err) {
            console.error("Password reset error:", err.code);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
                setError('Could not find an account with that email address.');
            } else {
                setError('Failed to send password reset email. Please try again.');
            }
        }
        setLoading(false);
    };

    // --- NEW: Conditional rendering for Login or Forgot Password ---
    if (view === 'forgotPassword') {
        return (
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700">
                <div>
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">Reset Password</h2>
                    <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
                        Enter your email to receive a reset link.
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handlePasswordReset}>
                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg flex items-center">
                           <AlertCircle className="mr-2" size={20} /> {error}
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="sr-only">Email address</label>
                        <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email address" />
                    </div>
                    <div>
                        <button type="submit" disabled={loading} className="button-primary w-full">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-center">
                    <button onClick={() => setView('login')} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Back to Login
                    </button>
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700">
            <div>
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">Sign in to your account</h2>
            </div>
            <form className="space-y-6" onSubmit={handleLogin}>
                 {/* --- NEW: Display login error message --- */}
                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg flex items-center">
                        <AlertCircle className="mr-2" size={20} /> {error}
                    </div>
                )}
                <div>
                    <label htmlFor="email" className="sr-only">Email address</label>
                    <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email address" />
                </div>
                <div className="relative">
                    <label htmlFor="password"className="sr-only">Password</label>
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field pr-10" placeholder="Password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <div className="flex items-center justify-end">
                    {/* --- NEW: Forgot Password link --- */}
                    <div className="text-sm">
                        <button type="button" onClick={() => setView('forgotPassword')} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                            Forgot your password?
                        </button>
                    </div>
                </div>

                <div>
                    <button type="submit" disabled={loading} className="button-primary w-full">
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const SignUp = () => {
    // ... (SignUp component remains unchanged)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: companyName });
            toast.success("Account created successfully! Please log in.");
        } catch (error) {
            toast.error(`Sign up failed: ${error.message}`);
        }
    };

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700">
             <div>
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">Create a new account</h2>
            </div>
            <form className="space-y-6" onSubmit={handleSignUp}>
                 <div>
                    <label htmlFor="companyName" className="sr-only">Company Name</label>
                    <input id="companyName" name="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="input-field" placeholder="Company Name" />
                </div>
                <div>
                    <label htmlFor="email-signup" className="sr-only">Email address</label>
                    <input id="email-signup" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email address" />
                </div>
                 <div className="relative">
                    <label htmlFor="password-signup" className="sr-only">Password</label>
                    <input id="password-signup" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field pr-10" placeholder="Password" />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                <div>
                    <button type="submit" className="button-primary w-full">Sign up</button>
                </div>
            </form>
        </div>
    );
};

export { Login, SignUp };