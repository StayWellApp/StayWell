import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-config'; // Corrected import path

// --- The Form for Adding or Editing a Property ---
export const PropertyForm = ({ onSave, onCancel, property = {} }) => {
    const [name, setName] = useState(property.name || '');
    const [address, setAddress] = useState(property.address || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name, address });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Property Name"
                className="w-full p-2 mb-2 rounded bg-white dark:bg-gray-700"
                required
            />
            <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Property Address"
                className="w-full p-2 mb-4 rounded bg-white dark:bg-gray-700"
                required
            />
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onCancel} className="button-secondary">
                    Cancel
                </button>
                <button type="submit" className="button-primary">
                    Save Property
                </button>
            </div>
        </form>
    );
};


// --- The Card for Displaying a Single Property (WITH UPLOAD LOGIC) ---
export const PropertyCard = ({ property, onSelect }) => {
    const [imageUpload, setImageUpload] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImageUpload(e.target.files[0]);
            setError(null);
        }
    };

    const handleImageUpload = async (e) => {
        e.stopPropagation(); // Prevent onSelect from firing when clicking upload
        if (imageUpload == null) return;

        setIsUploading(true);
        setError(null);
        const storage = getStorage();
        const imagePath = `properties/${property.id}/${Date.now()}_${imageUpload.name}`;
        const imageRef = ref(storage, imagePath);

        try {
            const snapshot = await uploadBytes(imageRef, imageUpload);
            const downloadURL = await getDownloadURL(snapshot.ref);
            const propertyDocRef = doc(db, 'properties', property.id);
            await updateDoc(propertyDocRef, { photoURL: downloadURL });
            alert('Image uploaded successfully!');
        } catch (err) {
            console.error("Error uploading image: ", err);
            setError('Failed to upload image.');
        } finally {
            setIsUploading(false);
            setImageUpload(null);
            if(document.getElementById(`file-input-${property.id}`)) {
                document.getElementById(`file-input-${property.id}`).value = "";
            }
        }
    };

    return (
        <div onClick={onSelect} className="property-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer">
            <img
                className="w-full h-48 object-cover"
                src={property.photoURL || 'https://via.placeholder.com/400x300.png?text=No+Image'}
                alt={`Photo of ${property.name}`}
            />
            <div className="p-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{property.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{property.address}</p>
                
                {/* --- Image Upload Section --- */}
                <div className="upload-section mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                     <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Update Photo</p>
                    <div className="flex items-center gap-2">
                         <input
                            type="file"
                            id={`file-input-${property.id}`}
                            onChange={handleImageChange}
                            onClick={(e) => e.stopPropagation()} // Prevent card click
                            className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            accept="image/*"
                        />
                        <button
                            onClick={handleImageUpload}
                            disabled={isUploading || !imageUpload}
                            className="button-primary text-xs px-2 py-1"
                        >
                            {isUploading ? '...' : 'Upload'}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
};