// PhotoUploadModal.js

import React, { useState } from 'react';
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { getFunctions, httpsCallable } from 'firebase/functions';


const PhotoUploadModal = ({ task, item, onClose, onPhotoUploaded }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    // This is a simplified frontend upload logic.
    // In a real app, you would call your 'uploadProof' Cloud Function
    // by passing the file to it.
    
    const functions = getFunctions();
    const uploadProof = httpsCallable(functions, 'uploadProof');

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', task.id);
        formData.append('itemIndex', item.index);
        formData.append('originalFilename', file.name);

        // This is a conceptual call. You'll need to adapt your
        // 'uploadProof' function to be a callable function or
        // use a direct upload to a signed URL from the client.
        // For simplicity, let's assume `uploadProof` can be called like this.
        
        // A better approach is to get a signed URL from a callable function
        // and upload the file directly to GCS from the client.
        
        // For now, let's stick to the existing HTTP request function.
        // You would need to make an HTTP POST request to your function URL.
        const response = await fetch('YOUR_CLOUD_FUNCTION_URL', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        
        onPhotoUploaded(item.index, data.proofURL);

    } catch (error) {
        console.error("Upload failed:", error);
    } finally {
        setIsUploading(false);
    }
  };


  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Upload Proof for: {item.name}</h3>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload & Complete'}
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default PhotoUploadModal;