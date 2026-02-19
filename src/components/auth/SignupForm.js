import React from 'react';
import { Mail, Lock, Building2, User, Phone, Globe } from 'lucide-react';
import InputField from './InputField';

const SignupForm = ({
    formState,
    handleInputChange,
    handleSubmit,
    errorMessage,
    isLoading,
    switchView
}) => {
    const { email, password, companyName, fullName, phone, country } = formState;

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
                <InputField id="password" type="password" placeholder="Password" value={password} onChange={handleInputChange} icon={Lock} />
                {errorMessage && <p className="text-sm text-center text-red-600 dark:text-red-400">{errorMessage}</p>}
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
};

export default SignupForm;
