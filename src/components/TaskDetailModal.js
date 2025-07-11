import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase-config'; // Corrected import path

const TaskDetailModal = ({ task, onClose }) => {
  const [proofUpload, setProofUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleProofChange = (e) => {
    if (e.target.files[0]) {
      setProofUpload(e.target.files[0]);
      setError(null);
    }
  };

  const handleProofUpload = async () => {
    if (proofUpload == null) {
        setError('Please select a file to upload.');
        return;
    };

    setIsUploading(true);
    setError(null);
    const storage = getStorage();
    const proofPath = `tasks/${task.id}/proofs/${Date.now()}_${proofUpload.name}`;
    const proofRef = ref(storage, proofPath);

    try {
      const snapshot = await uploadBytes(proofRef, proofUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      const taskDocRef = doc(db, 'tasks', task.id);
      await updateDoc(taskDocRef, {
        proofs: arrayUnion({
          url: downloadURL,
          uploadedAt: new Date().toISOString(),
          fileName: proofUpload.name,
        }),
      });
      alert('Proof uploaded successfully!');
    } catch (err) {
      console.error("Error uploading proof: ", err);
      setError('Failed to upload proof. Please try again.');
    } finally {
      setIsUploading(false);
      setProofUpload(null);
      if(document.getElementById(`proof-input-${task.id}`)){
        document.getElementById(`proof-input-${task.id}`).value = "";
      }
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
          <p>{task.description || 'No description.'}</p>
          <hr className="my-4" />

          <h4 className="font-bold">Proof of Completion</h4>
          <div className="proof-upload-section my-2">
            <input
              type="file"
              id={`proof-input-${task.id}`}
              onChange={handleProofChange}
              accept="image/*"
            />
            <button
              onClick={handleProofUpload}
              disabled={isUploading || !proofUpload}
              className="button-primary mt-2"
            >
              {isUploading ? 'Uploading...' : 'Upload Proof'}
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="proofs-gallery mt-4 grid grid-cols-3 gap-2">
            {task.proofs && task.proofs.length > 0 ? (
              task.proofs.map((proof, index) => (
                <a key={index} href={proof.url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={proof.url}
                    alt={`Proof ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                </a>
              ))
            ) : (
              <p className="col-span-3 text-gray-500">No proofs uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;