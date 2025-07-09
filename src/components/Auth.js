// --- src/components/Auth.js ---

import React, { useState } from 'react';
import { auth, db } from '../firebase-config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';

const InputField = ({ id, type, placeholder, value, onChange }) => (
    <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input-style"
        required
    />
);

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing in: ", error);
            alert(error.message);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">Login</h2>
            <form onSubmit={handleLogin} className="space-y-6">
                <InputField id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <InputField id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" className="w-full button-primary">Log In</button>
            </form>
        </div>
    );
};

export const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('Owner'); // Default role for new signups

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await updateProfile(user, { displayName });

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                role: role,
                createdAt: serverTimestamp(),
                ownerId: user.uid // An owner is their own owner
            });

        } catch (error) {
            console.error("Error signing up: ", error);
            alert(error.message);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">Create Account</h2>
            <form onSubmit={handleSignUp} className="space-y-6">
                <InputField id="displayName" type="text" placeholder="Full Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <InputField id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <InputField id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit" className="w-full button-primary">Sign Up</button>
            </form>
        </div>
    );
};