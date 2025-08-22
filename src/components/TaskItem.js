// A conceptual component for your TaskViews.js or a new TaskItem.js

import React, { useState } from 'react';
import PhotoUploadModal from './PhotoUploadModal'; // We will create this next

const TaskItem = ({ task, taskIndex, onToggleComplete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const handleCheckboxChange = (item, itemIndex) => {
    // If the item requires a photo and doesn't have one yet
    if (item.requiresPhoto && !item.photoURL) {
      setCurrentItem({ ...item, index: itemIndex });
      setIsModalOpen(true);
    } else {
      // Otherwise, just toggle completion
      onToggleComplete(taskIndex, itemIndex);
    }
  };

  const handlePhotoUploaded = (itemIndex, photoURL) => {
    // This function will be called from the modal
    // Here you would update the task in your state and Firestore
    console.log(`Photo for task ${task.id}, item ${itemIndex} uploaded: ${photoURL}`);
    onToggleComplete(taskIndex, itemIndex, photoURL);
    setIsModalOpen(false);
  };

  return (
    <div className="task-item">
      <div className="task-header" onClick={() => setIsExpanded(!isExpanded)}>
        <input
          type="checkbox"
          checked={task.isComplete}
          onChange={() => handleCheckboxChange(task, taskIndex)} // Simplified for the main task
        />
        <h4>{task.name}</h4>
        <span>{isExpanded ? '[-]' : '[+]'}</span>
      </div>

      {isExpanded && (
        <div className="task-body">
          <p>{task.description}</p>
          {task.checklistItems.map((item, itemIndex) => (
            <div key={itemIndex} className="checklist-item">
              <input
                type="checkbox"
                checked={item.isComplete}
                onChange={() => handleCheckboxChange(item, itemIndex)}
              />
              <label>{item.name}</label>
              {item.requiresPhoto && (
                <div className="photo-proof-section">
                  {item.photoURL ? (
                    <img src={item.photoURL} alt="Proof" />
                  ) : (
                    <button onClick={() => {
                      setCurrentItem({ ...item, index: itemIndex });
                      setIsModalOpen(true);
                    }}>
                      Upload Proof
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <PhotoUploadModal
          task={task}
          item={currentItem}
          onClose={() => setIsModalOpen(false)}
          onPhotoUploaded={handlePhotoUploaded}
        />
      )}
    </div>
  );
};

export default TaskItem;