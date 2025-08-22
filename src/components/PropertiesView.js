import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { PropertyForm } from './property/PropertyForm';
import { PropertyCard } from './property/PropertyCard';
import { Plus, Building } from 'lucide-react';
import { toast } from 'react-toastify';

const PropertiesView = ({ onSelectProperty, user, userData, hasPermission }) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const subscription = userData?.subscription;
    // For free plan (no subscription), allow a default of 1 property. Otherwise, use the plan's limit.
    const propertyLimit = subscription?.propertyLimit ?? 1;
    const canAddProperty = properties.length < propertyLimit;

    useEffect(() => {
        if (!user) return;

        let propertiesQuery;
        
        if (hasPermission('properties_view_all')) {
            propertiesQuery = query(collection(db, "properties"), where("ownerId", "==", userData?.ownerId || user.uid));
        } else {
            propertiesQuery = query(collection(db, "properties"), where("assignedStaff", "array-contains", user.uid));
        }

        const unsubscribe = onSnapshot(propertiesQuery, (snapshot) => {
            setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userData, hasPermission]);

    const handleAddProperty = async (propertyData) => {
        if (!canAddProperty) {
            toast.error(`You have reached your limit of ${propertyLimit} properties. Please upgrade your plan.`);
            return;
        }
        try {
            await addDoc(collection(db, "properties"), {
                ...propertyData,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            toast.success("Property added successfully!");
        } catch (error) {
            console.error("Error adding property: ", error);
            toast.error("Failed to add property.");
        }
    };
    
    const handleAddPropertyClick = () => {
        if (canAddProperty) {
            setShowForm(true);
        } else {
            toast.error(`You have reached your limit of ${propertyLimit} properties. Please contact support to upgrade.`);
        }
    };
    
    if (loading) {
        return <div className="p-8 text-center"><p>Loading properties...</p></div>;
    }

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Properties</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {hasPermission('properties_manage') ? `You are using ${properties.length} of your ${propertyLimit} available properties.` : "Showing properties assigned to you."}
                    </p>
                </div>
                {hasPermission('properties_manage') && (
                    <button 
                        onClick={handleAddPropertyClick} 
                        className={`button-primary ${!canAddProperty && 'opacity-50 cursor-not-allowed'}`}
                        title={!canAddProperty ? `Property limit reached (${propertyLimit})` : 'Add New Property'}
                    >
                        <Plus size={16} className="mr-2" /> Add Property
                    </button>
                )}
            </div>

            {showForm && (
                <PropertyForm
                    onSave={handleAddProperty}
                    onCancel={() => setShowForm(false)}
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
            {properties.length === 0 && !loading && !showForm && (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                     <Building size={48} className="mx-auto text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No properties yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first property.</p>
                </div>
            )}
        </div>
    );
};

export default PropertiesView;