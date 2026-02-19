import React from 'react';
import { Mail, Lock } from 'lucide-react';
import InputField from './InputField';
import { GoogleIcon, MicrosoftIcon } from './AuthIcons';

const LoginForm = ({
    formState,
    handleInputChange,
    handleSubmit,
    errorMessage,
    isLoading,
    switchView,
    handleSignInWithGoogle
}) => {
    const { email, password } = formState;

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
                {errorMessage && <p className="text-sm text-center text-red-600 dark:text-red-400">{errorMessage}</p>}
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
};

export default LoginForm;
