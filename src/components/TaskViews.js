// --- src/components/TaskViews.js ---
// Replace the entire contents of your TaskViews.js file with this code.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export const AddTaskForm = ({ onAddTask, checklistTemplates, team }) => {
    const [taskName, setTaskName] = useState('');
    const [taskType, setTaskType] = useState('Cleaning');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [assignedToId, setAssignedToId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!taskName) { alert("Please enter a task name."); return; }
        let taskData = { taskName, taskType, assignedToId };
        if (selectedTemplate) {
            const template = checklistTemplates.find(t => t.id === selectedTemplate);
            taskData.templateId = template.id;
            taskData.templateName = template.name;
        }
        if(assignedToId){
            const staffMember = team.find(s => s.id === assignedToId);
            taskData.assignedToEmail = staffMember.email;
        }
        onAddTask(taskData);
        setTaskName('');
        setSelectedTemplate('');
        setAssignedToId('');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded-lg my-4 space-y-3">
            <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Task Name (e.g., Post-Guest Turnover)" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select value={taskType} onChange={e => setTaskType(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Cleaning</option><option>Maintenance</option><option>Inventory</option><option>Other</option>
                </select>
                <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">No Checklist</option>
                    {checklistTemplates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                </select>
                 <select value={assignedToId} onChange={e => setAssignedToId(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Assign to...</option>
                    {team.map(member => (
                        <option key={member.id} value={member.id}>{member.email}</option>
                    ))}
                </select>
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">Save Task</button>
        </form>
    );
};

export const TaskDetailModal = ({ task, team, checklistTemplates, onClose }) => {
    const [currentTask, setCurrentTask] = useState(task);

    useEffect(() => {
        const taskRef = doc(db, 'tasks', task.id);
        const unsubscribe = onSnapshot(taskRef, (doc) => {
            setCurrentTask({ id: doc.id, ...doc.data() });
        });
        return unsubscribe;
    }, [task.id]);
    
    const checklist = checklistTemplates.find(t => t.id === currentTask.templateId);

    const handleUpdate = async (field, value) => {
        const taskRef = doc(db, 'tasks', currentTask.id);
        let updateData = { [field]: value };
        if (field === 'assignedToId') {
            const selectedStaff = team.find(s => s.id === value);
            updateData.assignedToEmail = selectedStaff ? selectedStaff.email : '';
        }
        await updateDoc(taskRef, updateData);
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            await deleteDoc(doc(db, 'tasks', currentTask.id));
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{currentTask.taskName}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Assign To</label>
                            <select value={currentTask.assignedToId || ''} onChange={e => handleUpdate('assignedToId', e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Unassigned</option>
                                {team.map(s => <option key={s.id} value={s.id}>{s.email}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Status</label>
                            <select value={currentTask.status} onChange={e => handleUpdate('status', e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Pending</option>
                                <option>In Progress</option>
                                <option>Completed</option>
                            </select>
                        </div>
                    </div>
                    {checklist && (
                        <div>
                            <h3 className="font-semibold mt-4 mb-2">{checklist.name}</h3>
                            <ul className="space-y-3">
                                {checklist.items.map((item, index) => (
                                    <li key={index} className="bg-gray-50 p-3 rounded-md border">
                                        <div className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                id={`owner-item-${index}`} 
                                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={currentTask.checklistProgress?.[index]?.completed || false}
                                                readOnly
                                            />
                                            <label htmlFor={`owner-item-${index}`} className="ml-3 block font-medium text-gray-900">{item.name}</label>
                                        </div>
                                        {currentTask.checklistProgress?.[index]?.proofURL && (
                                            <div className="mt-2 ml-8">
                                                <a href={currentTask.checklistProgress[index].proofURL} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View Proof</a>
                                                <img src={currentTask.checklistProgress[index].proofURL} alt="Proof" className="rounded-md max-h-40 mt-1" />
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">Delete Task</button>
                    <button onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Done</button>
                </div>
            </div>
        </div>
    );
};
