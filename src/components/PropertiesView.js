import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { PropertyCard, PropertyForm } from './PropertyViews';
import { Plus } from 'lucide-react';

const PropertiesView = ({ onSelectProperty, user, userData, hasPermission }) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        if (!user) return;

        let propertiesQuery;
        
        // Use the permission system to decide which properties to show
        if (hasPermission('properties_view_all')) {
            propertiesQuery = query(collection(db, "properties"), where("ownerId", "==", userData?.ownerId || user.uid));
        } else {
            // This assumes staff are assigned to properties via an 'assignedStaff' array field.
            propertiesQuery = query(collection(db, "properties"), where("assignedStaff", "array-contains", user.uid));
        }

        const unsubscribe = onSnapshot(propertiesQuery, (snapshot) => {
            setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userData, hasPermission]);


    const handleAddProperty = async (propertyData) => {
        try {
            await addDoc(collection(db, "properties"), {
                ...propertyData,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });
            setShowAddForm(false);
        } catch (error) {
            console.error("Error adding property: ", error);
        }
    };
    
    if (loading) {
        return <div className="p-8 text-center"><p>Loading properties...</p></div>
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Properties</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {hasPermission('properties_manage') ? "View, manage, and add your properties." : "Showing properties assigned to you."}
                    </p>
                </div>
                {/* --- This button is now controlled by permissions --- */}
                {hasPermission('properties_manage') && (
                    <button onClick={() => setShowAddForm(true)} className="button-primary">
                        <Plus size={18} className="-ml-1 mr-2" />
                        Add Property
                    </button>
                )}
            </div>

            {showAddForm && (
                <PropertyForm
                    onSave={handleAddProperty}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map(property => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        onSelect={() => onSelectProperty(property)}
                    />
                ))}
            </div>
            {properties.length === 0 && !loading && (
                <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No properties found.</p>
                </div>
            )}
        </div>
    );
};

export default PropertiesView;