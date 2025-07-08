// --- src/components/StaffDashboard.js ---
// Replace the entire contents of your StaffDashboard.js file with this code.

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { DashboardLayout } from './Layout';

export default function StaffDashboard({ onLogout, user }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [checklistTemplates, setChecklistTemplates] = useState([]);


    useEffect(() => {
        if (!user) return;

        const tasksQuery = query(collection(db, "tasks"), where("assignedToId", "==", user.uid));
        const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        
        const checklistsQuery = query(collection(db, "checklistTemplates"));
        const checklistsUnsubscribe = onSnapshot(checklistsQuery, (snapshot) => {
            setChecklistTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            tasksUnsubscribe();
            checklistsUnsubscribe();
        };
    }, [user]);

    return (
        <DashboardLayout onLogout={onLogout} user={user}>
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg max-w-4xl mx-auto">
                 <h2 className="text-3xl font-semibold text-gray-800 mb-6">My Assigned Tasks</h2>
                 {loading ? <p>Loading tasks...</p> : (
                     <ul className="space-y-4">
                         {tasks.length > 0 ? tasks.map(task => (
                             <li key={task.id} onClick={() => setSelectedTask(task)} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors">
                                 <div>
                                     <p className="font-bold text-lg text-gray-800">{task.taskName}</p>
                                     <p className="text-sm text-gray-600">{task.propertyName}</p>
                                     <p className="text-xs text-gray-500">{task.propertyAddress}</p>
                                 </div>
                                 <span className={`text-sm font-medium px-3 py-1 rounded-full ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{task.status}</span>
                             </li>
                         )) : <p className="text-center text-gray-500 py-8">You have no tasks assigned to you.</p>}
                     </ul>
                 )}
            </div>
            {selectedTask && <StaffTaskDetailModal task={selectedTask} checklistTemplates={checklistTemplates} onClose={() => setSelectedTask(null)} />}
        </DashboardLayout>
    );
};

const StaffTaskDetailModal = ({ task, checklistTemplates, onClose }) => {
    const [currentTask, setCurrentTask] = useState(task);
    const [isUploading, setIsUploading] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const taskRef = doc(db, 'tasks', task.id);
        const unsubscribe = onSnapshot(taskRef, (doc) => {
            setCurrentTask({ id: doc.id, ...doc.data() });
        });
        return unsubscribe;
    }, [task.id]);

    const checklist = checklistTemplates.find(t => t.id === currentTask.templateId);
    const checklistProgress = currentTask.checklistProgress || {};

    const handleStatusUpdate = async (newStatus) => {
        const taskRef = doc(db, 'tasks', currentTask.id);
        await updateDoc(taskRef, { status: newStatus });
    };

    const handleCheckItem = async (itemIndex, isChecked) => {
        const newProgress = {
            ...checklistProgress,
            [itemIndex]: {
                completed: isChecked,
                proofURL: checklistProgress[itemIndex]?.proofURL || null,
            }
        };
        const taskRef = doc(db, 'tasks', currentTask.id);
        await updateDoc(taskRef, { checklistProgress: newProgress });
    };
    
    const handleProofUploadClick = (itemIndex) => {
        fileInputRef.current.dataset.itemIndex = itemIndex;
        fileInputRef.current.click();
    };

    const handleFileSelected = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const itemIndex = parseInt(event.target.dataset.itemIndex, 10);
        setIsUploading(itemIndex);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("taskId", currentTask.id);
        formData.append("itemIndex", itemIndex);
        formData.append("originalFilename", file.name);

        try {
            // This URL has been updated with the one from your successful deployment.
            const functionUrl = "https://uploadproof-mw5hsegr4q-uc.a.run.app"; 
            
            const response = await fetch(functionUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorBody}`);
            }

            const result = await response.json();
            const proofURL = result.proofURL;

            const newProgress = {
                ...checklistProgress,
                [itemIndex]: {
                    ...(checklistProgress[itemIndex] || { completed: false }),
                    proofURL: proofURL,
                }
            };
            const taskRef = doc(db, 'tasks', currentTask.id);
            await updateDoc(taskRef, { checklistProgress: newProgress });

        } catch (error) {
            console.error("Error uploading file via cloud function:", error);
            alert("File upload failed. Check console for details.");
        } finally {
            setIsUploading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelected}
                accept="image/*"
            />
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold">{currentTask.taskName}</h2>
                        <p className="text-sm text-gray-500">{currentTask.propertyName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                
                <div className="space-y-4">
                    {checklist ? (
                        <div>
                            <h3 className="font-semibold mt-4 mb-2">{checklist.name}</h3>
                            <ul className="space-y-3">
                                {checklist.items.map((item, index) => (
                                    <li key={index} className="bg-gray-50 p-3 rounded-md border">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <input 
                                                    type="checkbox" 
                                                    id={`staff-item-${index}`} 
                                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={checklistProgress[index]?.completed || false}
                                                    onChange={(e) => handleCheckItem(index, e.target.checked)}
                                                />
                                                <label htmlFor={`staff-item-${index}`} className="ml-3 block font-medium text-gray-900">{item.name}</label>
                                            </div>
                                            <button 
                                                onClick={() => handleProofUploadClick(index)}
                                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200 disabled:opacity-50"
                                                disabled={isUploading === index}
                                            >
                                                {isUploading === index ? 'Uploading...' : checklistProgress[index]?.proofURL ? 'Change Proof' : 'Upload Proof'}
                                            </button>
                                        </div>
                                        {item.description && <p className="text-sm text-gray-600 mt-2 ml-8">{item.description}</p>}
                                        <div className="grid grid-cols-2 gap-4 mt-2 ml-8">
                                            {item.photoURL && (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 mb-1">Example:</p>
                                                    <img src={item.photoURL} alt="Example" className="rounded-md max-h-40" onError={(e) => e.target.style.display='none'} />
                                                </div>
                                            )}
                                            {checklistProgress[index]?.proofURL && (
                                                <div>
                                                    <p className="text-xs font-semibold text-green-600 mb-1">Your Proof:</p>
                                                    <img src={checklistProgress[index].proofURL} alt="Proof" className="rounded-md max-h-40" />
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : <p className="text-gray-500">This task has no checklist.</p>}
                </div>

                <div className="mt-6 pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-500 mb-2">Update Status</label>
                    <div className="flex space-x-2">
                        <button onClick={() => handleStatusUpdate('In Progress')} disabled={currentTask.status === 'In Progress' || currentTask.status === 'Completed'} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300">In Progress</button>
                        <button onClick={() => handleStatusUpdate('Completed')} disabled={currentTask.status === 'Completed'} className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-green-300">Completed</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
