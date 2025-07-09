// --- src/components/TaskViews.js ---
// This file provides the modals needed for viewing, editing, and adding tasks.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { doc, updateDoc, deleteDoc, serverTimestamp, addDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { Calendar, User, CheckSquare, Trash2, Plus, MessageSquare, Siren, ListChecks } from 'lucide-react';

export const AddTaskForm = ({ onAddTask, checklistTemplates, team, preselectedDate }) => {
    const [taskName, setTaskName] = useState('');
    const [taskType, setTaskType] = useState('Maintenance');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [scheduledDate, setScheduledDate] = useState(preselectedDate || '');
    const [assignedTo, setAssignedTo] = useState('');
    const [templateId, setTemplateId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!taskName) {
            alert("Please enter a task name.");
            return;
        }
        const assignedToEmail = team.find(member => member.uid === assignedTo)?.email || '';
        const selectedTemplate = checklistTemplates.find(t => t.id === templateId);
        
        const taskData = {
            taskName,
            taskType,
            description,
            priority,
            scheduledDate,
            assignedTo,
            assignedToEmail,
            templateId: selectedTemplate?.id || '',
            templateName: selectedTemplate?.name || '',
            // --- NEW: Copy checklist items into the task ---
            checklistItems: selectedTemplate ? selectedTemplate.items.map(itemText => ({ text: itemText, completed: false })) : [],
        };

        onAddTask(taskData);
        
        // Reset form
        setTaskName('');
        setTaskType('Maintenance');
        setDescription('');
        setPriority('Medium');
        setScheduledDate('');
        setAssignedTo('');
        setTemplateId('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 animate-fade-in-down">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New Task</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Name</label>
                        <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} className="mt-1 w-full input-style" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Type</label>
                        <select value={taskType} onChange={e => setTaskType(e.target.value)} className="mt-1 w-full input-style">
                            <option>Maintenance</option>
                            <option>Cleaning</option>
                            <option>Inspection</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full input-style" rows="2"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign To</label>
                        <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="mt-1 w-full input-style">
                            <option value="">Unassigned</option>
                            {team.map(member => <option key={member.id} value={member.uid}>{member.email}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                        <select value={priority} onChange={e => setPriority(e.target.value)} className="mt-1 w-full input-style">
                            <option>Low</option><option>Medium</option><option>High</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                        <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="mt-1 w-full input-style" />
                    </div>
                    {taskType === 'Cleaning' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Checklist Template</label>
                            <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="mt-1 w-full input-style">
                                <option value="">None</option>
                                {checklistTemplates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="button-primary">Create Task</button>
                </div>
            </form>
        </div>
    );
};

export const TaskDetailModal = ({ task, team, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState(task);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [checklist, setChecklist] = useState([]);

    useEffect(() => {
        setEditedTask(task);
        setChecklist(task.checklistItems || []);

        const commentsQuery = query(collection(db, `tasks/${task.id}/comments`));
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        return unsubscribe;
    }, [task]);

    const handleUpdate = async () => {
        const taskRef = doc(db, 'tasks', task.id);
        const assignedToEmail = team.find(member => member.uid === editedTask.assignedTo)?.email || '';
        await updateDoc(taskRef, { ...editedTask, assignedToEmail });
        setIsEditing(false);
    };
    
    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            await deleteDoc(doc(db, 'tasks', task.id));
            onClose();
        }
    };

    const handleInputChange = (field, value) => {
        setEditedTask(prev => ({ ...prev, [field]: value }));
    };
    
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        await addDoc(collection(db, `tasks/${task.id}/comments`), {
            text: newComment,
            author: "Admin",
            createdAt: serverTimestamp()
        });
        setNewComment('');
    };

    // --- NEW: Function to handle checklist item toggling ---
    const handleToggleChecklistItem = async (index) => {
        const newChecklist = [...checklist];
        newChecklist[index].completed = !newChecklist[index].completed;
        setChecklist(newChecklist);
        
        const taskRef = doc(db, 'tasks', task.id);
        await updateDoc(taskRef, { checklistItems: newChecklist });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-2xl border dark:border-gray-700 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{task.taskName}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">&times;</button>
                </div>

                <div className="overflow-y-auto pr-2 flex-grow">
                    {isEditing ? (
                        <div className="space-y-4">
                            <input type="text" value={editedTask.taskName} onChange={e => handleInputChange('taskName', e.target.value)} className="w-full input-style" />
                            <textarea value={editedTask.description} onChange={e => handleInputChange('description', e.target.value)} className="w-full input-style" rows="3" />
                            <select value={editedTask.status} onChange={e => handleInputChange('status', e.target.value)} className="w-full input-style">
                                <option>Pending</option><option>In Progress</option><option>Completed</option>
                            </select>
                            <select value={editedTask.priority} onChange={e => handleInputChange('priority', e.target.value)} className="w-full input-style">
                                <option>Low</option><option>Medium</option><option>High</option>
                            </select>
                            <select value={editedTask.assignedTo || ''} onChange={e => handleInputChange('assignedTo', e.target.value)} className="w-full input-style">
                                <option value="">Unassigned</option>
                                {team.map(member => <option key={member.id} value={member.uid}>{member.email}</option>)}
                            </select>
                            <input type="date" value={editedTask.scheduledDate} onChange={e => handleInputChange('scheduledDate', e.target.value)} className="w-full input-style" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-300">{task.description || 'No description provided.'}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <InfoItem icon={<CheckSquare size={16}/>} label="Status" value={task.status} />
                                <InfoItem icon={<Siren size={16}/>} label="Priority" value={task.priority} />
                                <InfoItem icon={<User size={16}/>} label="Assigned To" value={task.assignedToEmail || 'Unassigned'} />
                                <InfoItem icon={<Calendar size={16}/>} label="Due Date" value={task.scheduledDate || 'Not set'} />
                            </div>
                        </div>
                    )}
                    
                    {/* --- NEW: Interactive Checklist Section --- */}
                    {checklist && checklist.length > 0 && (
                        <div className="mt-6 pt-4 border-t dark:border-gray-700">
                            <TaskChecklist items={checklist} onToggle={handleToggleChecklistItem} />
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t dark:border-gray-700">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center"><MessageSquare size={18} className="mr-2"/>Comments</h4>
                        <div className="space-y-3 mb-4">
                            {comments.length > 0 ? comments.map(comment => (
                                <div key={comment.id} className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                                    <p className="text-gray-800 dark:text-gray-200">{comment.text}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">- {comment.author}</p>
                                </div>
                            )) : <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>}
                        </div>
                        <div className="flex space-x-2">
                            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-grow input-style" />
                            <button onClick={handleAddComment} className="button-primary px-4"><Plus size={16}/></button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-gray-700 flex-shrink-0">
                    <button onClick={handleDelete} className="text-sm font-semibold text-red-600 hover:text-red-500 flex items-center"><Trash2 size={14} className="mr-1.5"/> Delete Task</button>
                    {isEditing ? (
                        <div className="space-x-2">
                            <button onClick={() => setIsEditing(false)} className="button-secondary">Cancel</button>
                            <button onClick={handleUpdate} className="button-primary">Save Changes</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="button-primary">Edit Task</button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- NEW: Checklist Component ---
const TaskChecklist = ({ items, onToggle }) => {
    const completedCount = items.filter(item => item.completed).length;
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center"><ListChecks size={18} className="mr-2"/>Checklist</h4>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{completedCount} / {items.length} Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <ul className="space-y-2">
                {items.map((item, index) => (
                    <li key={index} onClick={() => onToggle(index)} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={item.completed} 
                            readOnly
                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className={`ml-3 text-sm font-medium ${item.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                            {item.text}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="text-gray-400 mt-0.5">{icon}</div>
        <div className="ml-3">
            <p className="font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);
