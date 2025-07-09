// --- src/App.js ---
// This is the complete, updated code for your main App component.

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

// Component Imports
import { Login, SignUp } from './components/Auth';
import Layout from './components/Layout';
import ClientDashboard from './components/ClientDashboard';
import PropertiesView from './components/PropertiesView';
import { PropertyDetailView } from './components/PropertyViews';
import TeamView from './components/TeamView';
import MasterCalendarView from './components/MasterCalendarView';
import { StorageView } from './components/StorageViews'; // <-- 1. IMPORT the new StorageView
import SettingsView from './components/SettingsView';

// A simple screen for handling the Login/SignUp forms
const AuthScreen = () => {
    const [showLogin, setShowLogin] = useState(true);
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center">
            <div className="w-full max-w-md p-4">
                {showLogin ? <Login /> : <SignUp />}
                <button
                    onClick={() => setShowLogin(!showLogin)}
                    className="mt-4 text-center w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                    {showLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
                </button>
            </div>
        </div>
    );
};

function App() {
    // --- STATE MANAGEMENT ---
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('dashboard'); // Default view
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);

    // --- AUTH & DATA FETCHING ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Fetch user role
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role);
                }

                // Listen for property changes
                const propertiesQuery = query(collection(db, "properties"), where("ownerId", "==", currentUser.uid));
                onSnapshot(propertiesQuery, (snapshot) => {
                    setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });

            } else {
                // Reset state on logout
                setUser(null);
                setUserRole(null);
                setProperties([]);
            }
            setLoading(false);
        });
        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);

    // --- EVENT HANDLERS ---
    const handleLogout = async () => {
        await signOut(auth);
        setActiveView('dashboard');
        setSelectedProperty(null);
    };

    const handleAddProperty = async (propertyData) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "properties"), {
                ...propertyData,
                ownerId: user.uid,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding property: ", error);
        }
    };

    const handleNavClick = (viewId) => {
        setSelectedProperty(null); // Deselect property when changing main views
        setActiveView(viewId);
    };

    // --- RENDER LOGIC ---
    if (loading) {
        return <div className="flex justify-center items-center h-screen font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900">Loading Application...</div>;
    }

    const renderView = () => {
        // If a property is selected, always show its detail view
        if (selectedProperty) {
            return <PropertyDetailView 
                        property={selectedProperty} 
                        onBack={() => setSelectedProperty(null)} 
                        user={user} 
                    />;
        }

        // Otherwise, show the selected main view
        switch (activeView) {
            case 'dashboard':
                return <ClientDashboard user={user} />;
            case 'properties':
                return <PropertiesView 
                            properties={properties}
                            onAddProperty={handleAddProperty}
                            onSelectProperty={setSelectedProperty}
                        />;
            case 'calendar':
                return <MasterCalendarView user={user} />;
            case 'team':
                return <TeamView user={user} />;
            case 'storage': // <-- 2. ADD CASE to render StorageView
                return <StorageView user={user} />;
            case 'settings':
                return <SettingsView user={user} />;
            default:
                return <ClientDashboard user={user} />;
        }
    };

    return (
        <div className="App">
            {!user ? (
                <AuthScreen />
            ) : (
                <Layout 
                    user={user} 
                    userRole={userRole}
                    activeView={activeView} 
                    setActiveView={handleNavClick} // Use the handler to manage view state
                    onLogout={handleLogout}
                >
                    {renderView()}
                </Layout>
            )}
        </div>
    );
}

export default App;
