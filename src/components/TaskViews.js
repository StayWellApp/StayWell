// --- src/components/TaskViews.js ---
// Replace the entire contents of your TaskViews.js file with this code.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// --- ✨ NEW: Helper for formatting dates ---
const formatDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
    return 'Not set';
};

export const AddTaskForm = ({ onAddTask, checklistTemplates, team }) => {
    const [taskName, setTaskName] = useState('');
    const [taskType, setTaskType] = useState('Cleaning');
    const [templateId, setTemplateId] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    
    // --- ✨ NEW: State for new fields ---
    const [priority, setPriority] = useState('Medium');
    const [scheduledDate, setScheduledDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!taskName || !scheduledDate) {
            alert("Please provide at least a task name and a scheduled date.");
            return;
        }
        const assignedToData = team.find(member => member.id === assignedTo);

        onAddTask({
            taskName,
            taskType,
            templateId,
            templateName: checklistTemplates.find(t => t.id === templateId)?.name || '',
            assignedToId: assignedToData?.id || '',
            assignedToEmail: assignedToData?.email || '',
            // --- ✨ NEW: Pass new fields to the save function ---
            priority,
            scheduledDate,
            dueDate,
            notes,
        });

        // Reset form
        setTaskName('');
        setTaskType('Cleaning');
        setTemplateId('');
        setAssignedTo('');
        setPriority('Medium');
        setScheduledDate('');
        setDueDate('');
        setNotes('');
    };

    return (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6 animate-fade-in-down">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Create a New Task</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="taskName">Task Name</label>
                        <input type="text" id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Post-Guest Cleaning" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="taskType">Task Type</label>
                        <select id="taskType" value={taskType} onChange={(e) => setTaskType(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Cleaning</option>
                            <option>Maintenance</option>
                            <option>Inventory Check</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>

                {taskType === 'Cleaning' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="checklistTemplate">Checklist Template (Optional)</label>
                        <select id="checklistTemplate" value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">None</option>
                            {checklistTemplates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                        </select>
                    </div>
                )}
                
                {/* --- ✨ NEW: Inputs for Dates and Priority --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="scheduledDate">Scheduled Date</label>
                        <input type="date" id="scheduledDate" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="dueDate">Due Date (Optional)</label>
                        <input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="priority">Priority</label>
                        <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="assignedTo">Assign To (Optional)</label>
                    <select id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Unassigned</option>
                        {team.map(member => <option key={member.id} value={member.id}>{member.email}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="notes">Notes (Optional)</label>
                    <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Add any specific instructions..."></textarea>
                </div>

                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">Save Task</button>
                </div>
            </form>
        </div>
    );
};


export const TaskDetailModal = ({ task, team, checklistTemplates, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableTask, setEditableTask] = useState({ ...task });

    useEffect(() => {
        // Ensure editableTask is in sync with the selected task prop
        setEditableTask({ ...task });
    }, [task]);

    const handleUpdate = async () => {
        const taskRef = doc(db, "tasks", task.id);
        try {
            // Create a new object for updating, don't include the full 'createdAt' object
            const updateData = {
                ...editableTask,
                lastUpdated: serverTimestamp()
            };
            // Remove fields that shouldn't be directly written
            delete updateData.id;
            delete updateData.createdAt;

            await updateDoc(taskRef, updateData);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating task: ", error);
            alert("Failed to update task.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditableTask(prev => ({ ...prev, [name]: value }));
    };
    
    // --- ✨ NEW: Priority Color Logic ---
    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-700';
            case 'Medium': return 'bg-yellow-100 text-yellow-700';
            case 'Low': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };
    
    const statusClasses = {
        'Completed': 'bg-green-100 text-green-700',
        'In Progress': 'bg-blue-100 text-blue-700',
        'Pending': 'bg-yellow-100 text-yellow-700',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    {isEditing ? (
                        <input
                            type="text"
                            name="taskName"
                            value={editableTask.taskName}
                            onChange={handleChange}
                            className="text-2xl font-bold text-gray-800 w-full p-2 border rounded-md"
                        />
                    ) : (
                        <h2 className="text-2xl font-bold text-gray-800">{task.taskName}</h2>
                    )}
                     <p className="text-sm text-gray-500">For property: {task.propertyName}</p>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* --- ✨ NEW: Enhanced Details Grid --- */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                        <div className="space-y-1">
                            <label className="text-gray-500 font-medium block">Status</label>
                            {isEditing ? (
                                <select name="status" value={editableTask.status} onChange={handleChange} className={`w-full p-2 border rounded-md ${statusClasses[editableTask.status] || 'bg-gray-100'}`}>
                                    <option>Pending</option>
                                    <option>In Progress</option>
                                    <option>Completed</option>
                                </select>
                            ) : (
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusClasses[task.status] || 'bg-gray-100'}`}>
                                    {task.status}
                                </span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-gray-500 font-medium block">Priority</label>
                             {isEditing ? (
                                <select name="priority" value={editableTask.priority} onChange={handleChange} className={`w-full p-2 border rounded-md ${getPriorityClass(editableTask.priority)}`}>
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            ) : (
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityClass(task.priority)}`}>
                                    {task.priority || 'Not set'}
                                </span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-gray-500 font-medium block">Assigned To</label>
                             {isEditing ? (
                                <select name="assignedToId" value={editableTask.assignedToId} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                                     <option value="">Unassigned</option>
                                     {team.map(member => <option key={member.id} value={member.id}>{member.email}</option>)}
                                </select>
                            ) : (
                                <span className="text-gray-800">{task.assignedToEmail || 'Unassigned'}</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-gray-500 font-medium block">Scheduled Date</label>
                             {isEditing ? (
                                <input type="date" name="scheduledDate" value={editableTask.scheduledDate} onChange={handleChange} className="w-full p-2 border rounded-md"/>
                            ) : (
                                <span className="text-gray-800">{editableTask.scheduledDate || 'Not set'}</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-gray-500 font-medium block">Due Date</label>
                            {isEditing ? (
                                <input type="date" name="dueDate" value={editableTask.dueDate} onChange={handleChange} className="w-full p-2 border rounded-md"/>
                            ) : (
                                <span className="text-gray-800">{editableTask.dueDate || 'Not set'}</span>
                            )}
                        </div>
                         <div className="space-y-1">
                            <label className="text-gray-500 font-medium block">Created On</label>
                            <span className="text-gray-800">{formatDate(task.createdAt)}</span>
                        </div>
                    </div>

                    {task.templateName && (
                        <div>
                            <label className="text-gray-500 font-medium block mb-1">Checklist</label>
                            <div className="bg-gray-50 border rounded-md p-3 text-gray-700">{task.templateName}</div>
                        </div>
                    )}

                    <div>
                        <label className="text-gray-500 font-medium block mb-1">Notes</label>
                        {isEditing ? (
                            <textarea name="notes" value={editableTask.notes} onChange={handleChange} className="w-full p-2 border rounded-md" rows="3"></textarea>
                        ) : (
                            <p className="text-gray-800 bg-gray-50 border rounded-md p-3 min-h-[60px]">{task.notes || 'No notes for this task.'}</p>
                        )}
                    </div>

                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                            <button onClick={handleUpdate} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Save Changes</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Edit Task</button>
                            <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Close</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};