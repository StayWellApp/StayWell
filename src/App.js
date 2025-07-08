import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import { Login, SignUp } from './components/Auth';
import ClientDashboard from './components/ClientDashboard';
import StaffDashboard from './components/StaffDashboard';
import { LoadingScreen, DashboardLayout } from './components/Layout';

const AdminDashboard = ({ onLogout, user }) => (
    <DashboardLayout onLogout={onLogout} user={user}>
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg">
             <h2 className="text-3xl font-semibold text-gray-800">Admin Dashboard</h2>
            <p className="text-gray-500 mt-2">Oversee all clients and platform activity here.</p>
        </div>
    </DashboardLayout>
);

export default function App() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role);
                }
                setUser(currentUser);
            } else {
                setUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const renderDashboard = () => {
        switch (userRole) {
            case 'Admin': return <AdminDashboard onLogout={handleLogout} user={user} />;
            case 'Property Owner': case 'Property Manager': return <ClientDashboard onLogout={handleLogout} user={user} />;
            case 'Cleaner': case 'Maintenance Worker': return <StaffDashboard onLogout={handleLogout} user={user} />;
            default: return <LoadingScreen message="Verifying user role..." />;
        }
    };

    if (loading) return <LoadingScreen message="Loading StayWellApp..." />;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {user ? (
                renderDashboard()
            ) : (
                <AuthView />
            )}
        </div>
    );
}

const AuthView = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    return (
        <div className="flex items-center justify-center w-full min-h-screen">
            <div className="w-full max-w-md p-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-blue-600">StayWellApp</h1>
                    <p className="text-gray-500 mt-2">Your property, perfectly managed.</p>
                </div>
                {isLoginView ? <Login toggleView={() => setIsLoginView(false)} /> : <SignUp toggleView={() => setIsLoginView(true)} />}
            </div>
        </div>
    );
};