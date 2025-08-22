import React, { useState } from 'react';
import { auth, db } from '../firebase-config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore"; // Import Timestamp
import { toast } from 'react-toastify';
import { User, Lock, LogIn, UserPlus, Mail, Building, Briefcase } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Logging in...');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.update(toastId, { render: "Logged in successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Authentication error:", error);
            toast.update(toastId, { render: error.message, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="input-style pl-10" />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="input-style pl-10" />
                </div>
                <button type="submit" className="button-primary w-full flex items-center justify-center">
                    <LogIn size={16} className="mr-2"/>Login
                </button>
            </form>
        </div>
    );
};

export const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [accountType, setAccountType] = useState('owner'); // owner or staff

    const handleSignUp = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Signing up...');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;
            
            await updateProfile(newUser, {
                displayName: companyName || newUser.email
            });

            // --- TRIAL LOGIC ---
            const userData = {
                uid: newUser.uid,
                email: newUser.email,
                role: accountType,
                companyName: companyName,
                createdAt: serverTimestamp(),
                displayName: companyName || newUser.email
            };

            // If the new user is a property owner, start a 14-day trial.
            if (accountType === 'owner') {
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 14);
                userData.subscription = {
                    planName: 'Trial',
                    status: 'trialing',
                    propertyLimit: 3, // Example limit for trials
                    renewalDate: Timestamp.fromDate(trialEndDate)
                };
            }
            // --- END TRIAL LOGIC ---

            await setDoc(doc(db, "users", newUser.uid), userData);

            toast.update(toastId, { render: "Account created successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Authentication error:", error);
            toast.update(toastId, { render: error.message, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">Sign Up</h2>
            <form onSubmit={handleSignUp} className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="input-style pl-10" />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="input-style pl-10" />
                </div>
                <div className="relative">
                   <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                   <input type="text" placeholder="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="input-style pl-10" />
                </div>
                <div className="pt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Type</label>
                    <div className="flex gap-4">
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer flex-1 ${accountType === 'owner' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'dark:border-gray-600'}`}>
                            <Briefcase className="mr-2 text-blue-600" size={20}/>
                            <input type="radio" name="accountType" value="owner" checked={accountType === 'owner'} onChange={() => setAccountType('owner')} className="hidden" />
                            <span className="font-semibold">Property Manager</span>
                        </label>
                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer flex-1 ${accountType === 'staff' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'dark:border-gray-600'}`}>
                            <User className="mr-2 text-blue-600" size={20}/>
                            <input type="radio" name="accountType" value="staff" checked={accountType === 'staff'} onChange={() => setAccountType('staff')} className="hidden" />
                             <span className="font-semibold">Staff Member</span>
                        </label>
                    </div>
                </div>
                <button type="submit" className="button-primary w-full flex items-center justify-center">
                    <UserPlus size={16} className="mr-2"/>Sign Up
                </button>
            </form>
        </div>
    );
};