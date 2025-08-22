import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
// FIXED: Added serverTimestamp to the import
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"; 
import { toast } from 'react-toastify';
import { User, Lock, LogIn, UserPlus, LogOut, Mail, Building, Briefcase } from 'lucide-react';

const Auth = ({ onAuthChange }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [user, setUser] = useState(null);
    // REMOVED: Unused state variable
    // const [role, setRole] = useState(null); 
    const [companyName, setCompanyName] = useState('');
    const [accountType, setAccountType] = useState('owner'); // owner or staff

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                const userData = userDoc.exists() ? userDoc.data() : {};
                setUser({ ...currentUser, ...userData });
                onAuthChange(true, { ...currentUser, ...userData });
            } else {
                setUser(null);
                onAuthChange(false, null);
            }
        });
        return () => unsubscribe();
    }, [onAuthChange]);
    
    const handleAuthAction = async (e) => {
        e.preventDefault();
        const toastId = toast.loading(`${isLogin ? 'Logging in' : 'Signing up'}...`);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                toast.update(toastId, { render: "Logged in successfully!", type: "success", isLoading: false, autoClose: 3000 });
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;
                await updateProfile(newUser, {
                    displayName: newUser.email // Default display name
                });
                await setDoc(doc(db, "users", newUser.uid), {
                    uid: newUser.uid,
                    email: newUser.email,
                    role: accountType,
                    companyName: companyName,
                    createdAt: serverTimestamp(),
                    displayName: newUser.email
                });
                toast.update(toastId, { render: "Account created successfully!", type: "success", isLoading: false, autoClose: 3000 });
            }
        } catch (error) {
            console.error("Authentication error:", error);
            toast.update(toastId, { render: error.message, type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        toast.success("Logged out successfully.");
    };

    if (user) {
        return (
            <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200">Welcome, {user.displayName || user.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Role: {user.role}</p>
                <button onClick={handleLogout} className="mt-4 button-secondary w-full flex items-center justify-center">
                    <LogOut size={16} className="mr-2"/>
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">{isLogin ? 'Login' : 'Sign Up'}</h2>
            <form onSubmit={handleAuthAction} className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="input-style pl-10" />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="input-style pl-10" />
                </div>

                {!isLogin && (
                    <>
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
                    </>
                )}

                <button type="submit" className="button-primary w-full flex items-center justify-center">
                    {isLogin ? <><LogIn size={16} className="mr-2"/>Login</> : <><UserPlus size={16} className="mr-2"/>Sign Up</>}
                </button>
            </form>
            <p className="text-center text-sm mt-6">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline font-semibold ml-1">
                    {isLogin ? 'Sign Up' : 'Login'}
                </button>
            </p>
        </div>
    );
};

export default Auth;