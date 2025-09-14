import React, { useState } from 'react';
import { auth } from '../firebase-config';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import { toast } from 'react-toastify';
import { Eye, EyeOff, AlertCircle, Building } from 'lucide-react';

// Main container for the authentication screen
const AuthLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md">
            <div className="flex justify-center items-center mb-6">
                <Building className="text-blue-600 dark:text-blue-400" size={32} />
                <h1 className="ml-3 text-3xl font-bold text-gray-800 dark:text-gray-200">StayWell</h1>
            </div>
            {children}
        </div>
    </div>
);

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('login');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Logged in successfully!");
        } catch (err) {
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

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success(`Password reset link sent to ${email}. Please check your inbox.`);
            setView('login');
        } catch (err) {
            setError(err.code === 'auth/user-not-found' ? 'Could not find an account with that email.' : 'Failed to send reset email.');
        }
        setLoading(false);
    };

    if (view === 'forgotPassword') {
        return (
            <AuthLayout>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border dark:border-gray-700">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter your email to receive a reset link.</p>
                    </div>
                    <form className="space-y-6" onSubmit={handlePasswordReset}>
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg flex items-center text-sm">
                               <AlertCircle className="mr-2 flex-shrink-0" size={20} /> {error}
                            </div>
                        )}
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email address" />
                        <button type="submit" disabled={loading} className="button-primary w-full">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <button onClick={() => setView('login')} className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                            Back to Login
                        </button>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border dark:border-gray-700">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sign in to your account</h2>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    {error && (
                         <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg flex items-center text-sm">
                            <AlertCircle className="mr-2 flex-shrink-0" size={20} /> {error}
                        </div>
                    )}
                    {/* --- FIX: Removed label and added a div for consistent sizing --- */}
                    <div>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email address" />
                    </div>
                    <div className="relative">
                        <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field pr-10" placeholder="Password" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    
                    <button type="submit" disabled={loading} className="button-primary w-full !mt-8">
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>

                    {/* --- FIX: Moved and reworded "Forgot password?" link --- */}
                    <div className="text-center pt-4">
                        <button type="button" onClick={() => setView('forgotPassword')} className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                            Forgot password?
                        </button>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
};

// --- SignUp component remains unchanged ---
const SignUp = () => {
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
        <AuthLayout>
             <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border dark:border-gray-700">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create a new account</h2>
                </div>
                <form className="space-y-6" onSubmit={handleSignUp}>
                    <div>
                        <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="input-field" placeholder="Company Name" />
                    </div>
                    <div>
                        <input id="email-signup" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email address" />
                    </div>
                    <div className="relative">
                        <input id="password-signup" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field pr-10" placeholder="Password" />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <button type="submit" className="button-primary w-full !mt-8">Sign up</button>
                </form>
            </div>
        </AuthLayout>
    );
};

export { Login, SignUp };