// src/components/property/PropertyForm.js
// This component handles the form for adding or editing a property.
// MODIFIED to support multiple image uploads.

import React, { useState, useEffect } from 'react';
import { storage } from '../../firebase-config';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from 'react-toastify';
import { AmenitiesForm, initialAmenitiesState } from './AmenitiesForm';
import { UploadCloud, X } from 'lucide-react';

const propertyTypes = ["House", "Apartment", "Guesthouse", "Hotel", "Cabin", "Barn", "Bed & Breakfast", "Boat", "Camper/RV", "Castle", "Tiny Home", "Treehouse"];

export const PropertyForm = ({ onSave, onCancel, existingProperty = null }) => {
    const [propertyName, setPropertyName] = useState('');
    const [propertyType, setPropertyType] = useState(propertyTypes[0]);
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [bedrooms, setBedrooms] = useState(1);
    const [bathrooms, setBathrooms] = useState(1);
    const [guests, setGuests] = useState(2);
    const [amenities, setAmenities] = useState(initialAmenitiesState);
    
    // --- NEW: State for multiple photos ---
    const [imageFiles, setImageFiles] = useState([]); // Holds new files to be uploaded
    const [existingImageUrls, setExistingImageUrls] = useState([]); // Holds URLs from DB
    const [imagePreviews, setImagePreviews] = useState([]); // Holds URLs for display (both existing and new previews)

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (existingProperty) {
            setPropertyName(existingProperty.propertyName || '');
            setPropertyType(existingProperty.propertyType || propertyTypes[0]);
            setAddress(existingProperty.address || '');
            setDescription(existingProperty.description || '');
            setBedrooms(existingProperty.bedrooms || 1);
            setBathrooms(existingProperty.bathrooms || 1);
            setGuests(existingProperty.guests || 2);
            setAmenities(existingProperty.amenities || initialAmenitiesState);
            
            // --- NEW: Populate image states ---
            const urls = existingProperty.photoURLs || [];
            setExistingImageUrls(urls);
            setImagePreviews(urls);
        }
    }, [existingProperty]);

    // --- NEW: Handle multiple file selection ---
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(prev => [...prev, ...files]);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };
    
    // --- NEW: Remove an image before upload ---
    const handleRemoveImage = (indexToRemove) => {
        // Create a copy of the previews to find the URL to remove
        const urlToRemove = imagePreviews[indexToRemove];

        // Filter out the preview
        setImagePreviews(previews => previews.filter((_, i) => i !== indexToRemove));

        // Check if the removed URL was an existing one or a new file preview
        if (existingImageUrls.includes(urlToRemove)) {
            // If it was an existing URL, remove it from that list
            setExistingImageUrls(urls => urls.filter(url => url !== urlToRemove));
        } else {
            // If it was a new file, find its corresponding blob URL and remove the file
            setImageFiles(files => files.filter(file => URL.createObjectURL(file) !== urlToRemove));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!propertyName || !address) {
            toast.error("Please fill out at least the property name and address.");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Saving property...");

        try {
            // --- NEW: Upload multiple new images ---
            const newImageUrls = await Promise.all(
                imageFiles.map(async (file) => {
                    const photoRef = ref(storage, `property_photos/${existingProperty.id || Date.now()}/${Date.now()}_${file.name}`);
                    await uploadBytes(photoRef, file);
                    return await getDownloadURL(photoRef);
                })
            );

            // Combine old and newly uploaded URLs
            const allPhotoURLs = [...existingImageUrls, ...newImageUrls];

            const propertyData = {
                propertyName,
                propertyType,
                address,
                description,
                bedrooms,
                bathrooms,
                guests,
                amenities,
                // --- NEW: Save array of URLs ---
                photoURLs: allPhotoURLs,
                // Set the first image as the main one for card view
                mainPhotoURL: allPhotoURLs[0] || '',
            };
            
            await onSave(propertyData);

            toast.update(toastId, { 
                render: `Property saved successfully!`, 
                type: "success", 
                isLoading: false, 
                autoClose: 3000 
            });

        } catch (error) {
            console.error("Error saving property:", error);
            toast.update(toastId, { 
                render: `Failed to save property. Please try again.`, 
                type: "error", 
                isLoading: false, 
                autoClose: 5000 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 animate-fade-in-down">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{existingProperty ? 'Edit Property' : 'Add a New Property'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* --- Other form fields remain the same --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="propertyName">Property Name</label><input type="text" id="propertyName" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} className="input-style" placeholder="e.g., Downtown Loft" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="propertyType">Property Type</label><select id="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="input-style">{propertyTypes.map(type => <option key={type}>{type}</option>)}</select></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="address">Address</label><input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="input-style" placeholder="e.g., 123 Main St, Anytown" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="description">Description</label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="input-style" rows="3" placeholder="A brief description of the property..."></textarea></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="guests">Max Guests</label><input type="number" id="guests" value={guests} min="1" onChange={(e) => setGuests(parseInt(e.target.value))} className="input-style" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="bedrooms">Bedrooms</label><input type="number" id="bedrooms" value={bedrooms} min="0" onChange={(e) => setBedrooms(parseInt(e.target.value))} className="input-style" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="bathrooms">Bathrooms</label><input type="number" id="bathrooms" value={bathrooms} min="1" step="0.5" onChange={(e) => setBathrooms(parseFloat(e.target.value))} className="input-style" /></div>
                </div>
                <AmenitiesForm amenities={amenities} setAmenities={setAmenities} />
                
                {/* --- NEW: Multiple Photo Upload Field --- */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Property Photos</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {imagePreviews.map((previewUrl, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-lg shadow-md" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        <label htmlFor="photo-upload" className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <UploadCloud size={24} className="text-gray-400" />
                            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">Add photos</span>
                            <input id="photo-upload" type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*" />
                        </label>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                    <button type="submit" className="button-primary" disabled={isLoading}>
                        {isLoading ? 'Saving...' : (existingProperty ? 'Update Property' : 'Save Property')}
                    </button>
                </div>
            </form>
        </div>
    );
};
