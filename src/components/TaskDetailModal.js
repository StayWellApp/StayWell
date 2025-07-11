import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure you have initialized Firebase and exported db

/**
 * A modal component to show task details and allow for proof of completion uploads.
 *
 * @param {object} props - The component props.
 * @param {object} props.task - The task object. Should have an `id` and a `proofs` array.
 * @param {function} props.onClose - Function to close the modal.
 */
const TaskDetailModal = ({ task, onClose }) => {
  const [proofUpload, setProofUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // Handles the file selection
  const handleProofChange = (e) => {
    if (e.target.files[0]) {
      setProofUpload(e.target.files[0]);
      setError(null);
    }
  };

  // Handles the proof upload to Firebase Storage
  const handleProofUpload = async () => {
    if (proofUpload == null) {
        setError('Please select a file to upload.');
        return;
    };

    setIsUploading(true);
    setError(null);
    const storage = getStorage();
    // Create a unique file path for the proof
    const proofPath = `tasks/${task.id}/proofs/${Date.now()}_${proofUpload.name}`;
    const proofRef = ref(storage, proofPath);

    try {
      // Upload the file
      const snapshot = await uploadBytes(proofRef, proofUpload);
      // Get the public URL of the uploaded file
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Add the new proof object to the 'proofs' array in the task document
      const taskDocRef = doc(db, 'tasks', task.id);
      await updateDoc(taskDocRef, {
        proofs: arrayUnion({
          url: downloadURL,
          uploadedAt: new Date().toISOString(), // Use ISO string for consistency
          fileName: proofUpload.name,
        }),
      });

       // You might want to refetch task data here to show the new proof instantly
      alert('Proof uploaded successfully!');

    } catch (err) {
      console.error("Error uploading proof: ", err);
      setError('Failed to upload proof. Please try again.');
    } finally {
      setIsUploading(false);
      setProofUpload(null);
      // Reset file input
      document.getElementById(`proof-input-${task.id}`).value = "";
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Task: {task.title || 'Task Details'}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>

        <div className="modal-body">
          {/* Assume other task details are rendered here */}
          <p>{task.description || 'No description.'}</p>

          <hr style={{ margin: '20px 0' }} />

          <h4>Proof of Completion</h4>
          <div className="proof-upload-section">
            <input
              type="file"
              id={`proof-input-${task.id}`} // Unique ID for the file input
              onChange={handleProofChange}
              accept="image/*"
            />
            <button
              onClick={handleProofUpload}
              disabled={isUploading || !proofUpload}
            >
              {isUploading ? 'Uploading...' : 'Upload Proof'}
            </button>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
          </div>

          <div className="proofs-gallery" style={{ marginTop: '20px' }}>
            {task.proofs && task.proofs.length > 0 ? (
              task.proofs.map((proof, index) => (
                <a key={index} href={proof.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={proof.url}
                    alt={`Proof ${index + 1}`}
                    style={{ width: '100px', height: '100px', objectFit: 'cover', margin: '5px', borderRadius: '4px' }}
                  />
                </a>
              ))
            ) : (
              <p>No proofs have been uploaded for this task yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;