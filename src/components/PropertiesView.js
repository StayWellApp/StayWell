import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure you have initialized Firebase and exported db

/**
 * A component to display and manage a single property's details,
 * including photo uploads.
 *
 * @param {object} props - The component props.
 * @param {object} props.property - The property object. Should have at least an `id` and `photoURL`.
 */
const PropertyViews = ({ property }) => {
  const [imageUpload, setImageUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // Handles the file selection
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageUpload(e.target.files[0]);
      setError(null); // Clear previous errors
    }
  };

  // Handles the file upload to Firebase Storage
  const handleImageUpload = async () => {
    if (imageUpload == null) {
      setError('Please select an image to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    const storage = getStorage();
    // Create a unique file path for the image
    const imagePath = `properties/${property.id}/${Date.now()}_${imageUpload.name}`;
    const imageRef = ref(storage, imagePath);

    try {
      // Upload the file
      const snapshot = await uploadBytes(imageRef, imageUpload);
      // Get the public URL of the uploaded file
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update the property document in Firestore with the new photo URL
      const propertyDocRef = doc(db, 'properties', property.id);
      await updateDoc(propertyDocRef, {
        photoURL: downloadURL,
      });

      // You might want to update the local state or refetch property data here
      alert('Image uploaded and property updated successfully!');

    } catch (err) {
      console.error("Error uploading image: ", err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setImageUpload(null);
      // Reset file input
      document.getElementById(`file-input-${property.id}`).value = "";
    }
  };

  return (
    <div className="property-card">
      {/* Assume some existing property details are displayed here */}
      <h3>{property.name || 'Property Details'}</h3>
      <p>{property.address || 'No address provided.'}</p>

      <hr style={{ margin: '20px 0' }} />

      <h4>Property Photo</h4>

      {property.photoURL ? (
        <div className="current-photo">
          <p>Current Image:</p>
          <img
            src={property.photoURL}
            alt="Property"
            style={{ maxWidth: '300px', height: 'auto', borderRadius: '8px' }}
          />
        </div>
      ) : (
        <p>No photo has been uploaded for this property yet.</p>
      )}

      <div className="upload-section" style={{ marginTop: '20px' }}>
        <input
          type="file"
          id={`file-input-${property.id}`} // Unique ID for the file input
          onChange={handleImageChange}
          accept="image/*" // Accept only image files
        />
        <button
          onClick={handleImageUpload}
          disabled={isUploading || !imageUpload}
          style={{ marginLeft: '10px' }}
        >
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
};

export default PropertyViews;