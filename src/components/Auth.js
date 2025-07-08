import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, query, collection, where, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase-config';

export function Login({ toggleView }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error logging in:", error);
            alert(`Login failed: ${error.message}`);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Welcome Back!</h2>
            <form onSubmit={handleLogin}>
                <div className="mb-4"><label className="block text-gray-600 mb-2" htmlFor="email">Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" /></div>
                <div className="mb-6"><label className="block text-gray-600 mb-2" htmlFor="password">Password</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" /></div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">Log In</button>
            </form>
            <p className="text-center text-gray-500 mt-6">Don't have an account?{' '}<button onClick={toggleView} className="text-blue-600 hover:underline font-semibold">Sign Up</button></p>
        </div>
    );
}

export function SignUp({ toggleView }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Property Owner');

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;
            
            const invitesQuery = query(collection(db, "invitations"), where("staffEmail", "==", email.toLowerCase()), where("status", "==", "pending"));
            const invitesSnapshot = await getDocs(invitesQuery);

            let ownerId = null;
            if (!invitesSnapshot.empty) {
                const invite = invitesSnapshot.docs[0];
                ownerId = invite.data().ownerId;
                
                const ownerRef = doc(db, "users", ownerId);
                await updateDoc(ownerRef, { teamMembers: arrayUnion(newUser.uid) });
                
                await updateDoc(invite.ref, { status: "accepted", staffId: newUser.uid });
            }

            await setDoc(doc(db, "users", newUser.uid), { email: newUser.email, role: role, ownerId: ownerId, createdAt: serverTimestamp() });

        } catch (error) {
            console.error("Error signing up:", error);
            alert(`Sign-up failed: ${error.message}`);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Create Your Account</h2>
            <form onSubmit={handleSignUp}>
                <div className="mb-4"><label className="block text-gray-600 mb-2" htmlFor="signup-email">Email</label><input type="email" id="signup-email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" /></div>
                <div className="mb-4"><label className="block text-gray-600 mb-2" htmlFor="signup-password">Password</label><input type="password" id="signup-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Minimum 6 characters" /></div>
                <div className="mb-6"><label className="block text-gray-600 mb-2" htmlFor="role">I am a...</label><select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option>Property Owner</option><option>Property Manager</option><option>Cleaner</option><option>Maintenance Worker</option></select></div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">Sign Up</button>
            </form>
            <p className="text-center text-gray-500 mt-6">Already have an account?{' '}<button onClick={toggleView} className="text-blue-600 hover:underline font-semibold">Log In</button></p>
        </div>
    );
}