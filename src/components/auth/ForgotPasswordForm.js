import React from 'react';
import { Mail } from 'lucide-react';
import InputField from './InputField';

const ForgotPasswordForm = ({
    formState,
    handleInputChange,
    handleForgotPassword,
    errorMessage,
    successMessage,
    isLoading,
    switchView
}) => {
    const { email } = formState;

    return (
        <>
            <div className="text-center lg:text-left mb-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Enter your email to receive a reset link.</p>
            </div>
            <form className="space-y-5" onSubmit={handleForgotPassword}>
                <InputField id="email" type="email" placeholder="Email Address" value={email} onChange={handleInputChange} icon={Mail} />
                {successMessage && <p className="text-sm text-center text-green-600 dark:text-green-400">{successMessage}</p>}
                {errorMessage && <p className="text-sm text-center text-red-600 dark:text-red-400">{errorMessage}</p>}
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
};

export default ForgotPasswordForm;
