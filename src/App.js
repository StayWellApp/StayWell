// --- src/App.js ---
// Replace the entire contents of your App.js file with this code.

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

import { Login, SignUp } from './components/Auth';
import Layout from './components/Layout';
import ClientDashboard from './components/ClientDashboard';
import PropertiesView from './components/PropertiesView';
import { PropertyDetailView } from './components/PropertyViews'; // Note the import change

const AuthScreen = () => {
    const [showLogin, setShowLogin] = useState(true);
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <div className="w-full max-w-md p-4">
                {showLogin ? <Login /> : <SignUp />}
                <button
                    onClick={() => setShowLogin(!showLogin)}
                    className="mt-4 text-center w-full text-sm text-blue-600 hover:underline"
                >
                    {showLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
                </button>
            </div>
        </div>
    );
};

function App() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');

    // State management for properties
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role);
                }

                // Fetch properties for the logged-in user
                const propertiesQuery = query(collection(db, "properties"), where("ownerId", "==", currentUser.uid));
                onSnapshot(propertiesQuery, (snapshot) => {
                    setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });

            } else {
                setUser(null);
                setUserRole(null);
                setProperties([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

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

    if (loading) {
        return <div className="flex justify-center items-center h-screen font-semibold text-gray-500">Loading Application...</div>;
    }

    const renderView = () => {
        // If a property is selected, always show its detail view regardless of the active tab
        if (selectedProperty) {
            return <PropertyDetailView 
                        property={selectedProperty} 
                        onBack={() => setSelectedProperty(null)} 
                        user={user} 
                    />;
        }

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
                return <div className="p-8"><h1 className="text-3xl font-bold">Master Calendar (Coming Soon)</h1></div>;
            case 'team':
                return <div className="p-8"><h1 className="text-3xl font-bold">Team Management (Coming Soon)</h1></div>;
            case 'settings':
                return <div className="p-8"><h1 className="text-3xl font-bold">Settings (Coming Soon)</h1></div>;
            default:
                return <ClientDashboard user={user} />;
        }
    };

    return (
        <div className="App">
            {!user ? (
                <AuthScreen />
            ) : (
                <Layout activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout}>
                    {renderView()}
                </Layout>
            )}
        </div>
    );
}

export default App;
