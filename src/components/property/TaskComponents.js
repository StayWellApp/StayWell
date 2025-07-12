// src/components/property/TaskComponents.js
// This file contains smaller, reusable components related to tasks.
// MODIFIED to improve the task editing experience and use real usernames for comments.

import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../../firebase-config';
import { doc, updateDoc, deleteDoc, serverTimestamp, addDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Calendar, User, CheckSquare, Trash2, Plus, MessageSquare, Siren, ListChecks, Info, Image, ChevronDown, Upload, Repeat, Edit, X, ShieldCheck, Paperclip } from 'lucide-react';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

export const AddTaskForm = ({ onAddTask, onCancel, checklistTemplates, team, preselectedDate }) => {
    const [taskName, setTaskName] = useState('');
    const [taskType, setTaskType] = useState('Maintenance');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [scheduledDate, setScheduledDate] = useState(preselectedDate || '');
    const [assignedTo, setAssignedTo] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState('weekly');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!taskName) {
            toast.error("Please enter a task name.");
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
            checklistItems: selectedTemplate ? selectedTemplate.items.map(item => ({ ...item, completed: false, proofUrl: '' })) : [],
            recurring: {
                enabled: isRecurring,
                frequency: isRecurring ? recurringFrequency : null,
                isPrototype: isRecurring, // Mark this as the prototype for recurring series
            }
        };

        onAddTask(taskData);
        onCancel();
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
                <div className="pt-4 border-t dark:border-gray-600 space-y-3">
                     <div className="flex items-center">
                        <input id="recurring-checkbox" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="recurring-checkbox" className="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-200">Make this a recurring task</label>
                    </div>
                    {isRecurring && (
                        <div className="pl-6 animate-fade-in-down">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Repeat every</label>
                            <select value={recurringFrequency} onChange={e => setRecurringFrequency(e.target.value)} className="mt-1 w-full md:w-1/2 input-style">
                                <option value="daily">Day</option>
                                <option value="weekly">Week</option>
                                <option value="monthly">Month</option>
                            </select>
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                    <button type="submit" className="button-primary">Create Task</button>
                </div>
            </form>
        </div>
    );
};

const EditDetailsModal = ({ task, onSave, onCancel }) => {
    const [taskName, setTaskName] = useState(task.taskName);
    const [description, setDescription] = useState(task.description);

    const handleSave = () => {
        onSave({ taskName, description });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Edit Task Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Name</label>
                        <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} className="mt-1 w-full input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full input-style" rows="4"></textarea>
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-6 mt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                    <button type="button" onClick={handleSave} className="button-primary">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export const TaskDetailModal = ({ task, team, user, onClose }) => {
    const [liveTask, setLiveTask] = useState(task);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [checklist, setChecklist] = useState([]);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    
    // --- FIXED: Re-added state for general proof upload ---
    const [proofFile, setProofFile] = useState(null);
    const [isUploadingProof, setIsUploadingProof] = useState(false);

    const debouncedUpdate = useCallback(debounce(async (taskId, data) => {
        const taskRef = doc(db, 'tasks', taskId);
        try {
            await updateDoc(taskRef, data);
            toast.success("Task auto-saved!", { autoClose: 1500, position: "bottom-right" });
        } catch (error) {
            console.error("Auto-save failed:", error);
            toast.error("Failed to save changes.");
        }
    }, 1000), []);

    useEffect(() => {
        const taskRef = doc(db, 'tasks', task.id);
        const unsubscribeTask = onSnapshot(taskRef, (doc) => {
            if (doc.exists()) {
                const taskData = { id: doc.id, ...doc.data() };
                setLiveTask(taskData);
                setChecklist(taskData.checklistItems || []);
            }
        });
        const commentsQuery = query(collection(db, `tasks/${task.id}/comments`));
        const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            fetchedComments.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setComments(fetchedComments);
        }, (error) => {
            console.error("Error fetching comments:", error);
            toast.error("Could not load comments.");
        });
        return () => { unsubscribeTask(); unsubscribeComments(); };
    }, [task.id]);

    // --- FIXED: Re-added handler for general proof file selection ---
    const handleProofFileChange = (e) => {
        if (e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };
    
    // --- FIXED: Re-added handler for general proof upload ---
    const handleProofUpload = async () => {
        if (!proofFile) {
            toast.error("Please select a file to upload.");
            return;
        }
        setIsUploadingProof(true);
        const toastId = toast.loading("Uploading proof...");
        try {
            const proofRef = ref(storage, `proofs/${task.id}/${Date.now()}-${proofFile.name}`);
            const uploadResult = await uploadBytes(proofRef, proofFile);
            const proofURL = await getDownloadURL(uploadResult.ref);
            await addDoc(collection(db, `tasks/${task.id}/comments`), {
                text: `Proof of completion uploaded.`,
                author: user?.displayName || user?.email || "System",
                createdAt: serverTimestamp(),
                isProof: true,
                proofURL: proofURL
            });
            await updateDoc(doc(db, 'tasks', task.id), {
                lastProofURL: proofURL,
                status: 'Completed'
            });
            toast.update(toastId, { render: "Proof uploaded successfully!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.error("Error uploading proof:", error);
            toast.update(toastId, { render: "Failed to upload proof.", type: "error", isLoading: false, autoClose: 5000 });
        } finally {
            setIsUploadingProof(false);
            setProofFile(null);
        }
    };

    const createNextRecurringTask = async (completedTask) => {
        const { recurring, ...originalTaskData } = completedTask;
        if (!recurring?.enabled || !originalTaskData.scheduledDate) return;
        let nextDueDate = new Date(originalTaskData.scheduledDate);
        if (isNaN(nextDueDate.getTime())) { console.warn("Cannot create recurring task: invalid original due date."); return; }
        if (recurring.frequency === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
        else if (recurring.frequency === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
        else if (recurring.frequency === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        const newTask = { ...originalTaskData, status: 'Pending', scheduledDate: nextDueDate.toISOString().split('T')[0], createdAt: serverTimestamp(), lastProofURL: null, checklistItems: originalTaskData.checklistItems.map(item => ({ ...item, completed: false, proofUrl: '' })), recurring: { ...recurring, isPrototype: false } };
        delete newTask.id;
        try {
            await addDoc(collection(db, "tasks"), newTask);
            toast.info(`Next recurring task for "${newTask.taskName}" has been created.`);
        } catch (error) {
            console.error("Failed to create next recurring task:", error);
            toast.error("Could not create the next recurring task.");
        }
    };

    const handleImmediateUpdate = (field, value) => {
        let updatedData = { [field]: value };
        if (field === 'assignedTo') {
            const assignedToEmail = team.find(member => member.uid === value)?.email || '';
            updatedData.assignedToEmail = assignedToEmail;
        }
        if (field === 'status' && value === 'Completed') {
            const allProofMet = !checklist.some(item => item.proofRequired && !item.proofUrl);
            if (!allProofMet) {
                toast.error("Cannot complete task: Not all required proofs have been uploaded.");
                return; // Prevent update
            }
            if (liveTask.status !== 'Completed' && liveTask.recurring?.enabled) {
                createNextRecurringTask(liveTask);
            }
        }
        setLiveTask(prev => ({ ...prev, ...updatedData }));
        debouncedUpdate(task.id, updatedData);
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
            const toastId = toast.loading("Deleting task...");
            try {
                await deleteDoc(doc(db, 'tasks', task.id));
                toast.update(toastId, { render: "Task deleted.", type: "success", isLoading: false, autoClose: 3000 });
                onClose();
            } catch (error) {
                console.error("Error deleting task:", error);
                toast.update(toastId, { render: "Failed to delete task.", type: "error", isLoading: false, autoClose: 5000 });
            }
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            await addDoc(collection(db, `tasks/${task.id}/comments`), { text: newComment, author: user?.displayName || user?.email || "User", createdAt: serverTimestamp() });
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error("Could not add comment.");
        }
    };

    const handleChecklistItemUpdate = async (index, updatedItemData) => {
        const newChecklist = [...checklist];
        newChecklist[index] = { ...newChecklist[index], ...updatedItemData };
        setChecklist(newChecklist);
        try {
            await updateDoc(doc(db, 'tasks', task.id), { checklistItems: newChecklist });
        } catch (error) {
            console.error("Error updating checklist:", error);
            toast.error("Could not save checklist change.");
        }
    };

    const handleSaveDetails = async (details) => {
        const toastId = toast.loading("Saving details...");
        try {
            await updateDoc(doc(db, 'tasks', task.id), details);
            toast.update(toastId, { render: "Details saved!", type: "success", isLoading: false, autoClose: 2000 });
            setIsEditingDetails(false);
        } catch (error) {
            console.error("Error saving details:", error);
            toast.update(toastId, { render: "Failed to save details.", type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    return (
        <>
            {isEditingDetails && <EditDetailsModal task={liveTask} onSave={handleSaveDetails} onCancel={() => setIsEditingDetails(false)} />}
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-2xl border dark:border-gray-700 max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            {liveTask.recurring?.enabled && <Repeat size={18} className="text-gray-400" title={`Repeats ${liveTask.recurring.frequency}`} />}
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{liveTask.taskName}</h3>
                            <button onClick={() => setIsEditingDetails(true)} className="text-gray-400 hover:text-blue-500"><Edit size={16} /></button>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-full"><X size={20} /></button>
                    </div>
                    <div className="overflow-y-auto pr-2 flex-grow">
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{liveTask.description || 'No description provided.'}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <InlineSelect label="Status" value={liveTask.status} options={['Pending', 'In Progress', 'Completed']} onChange={(e) => handleImmediateUpdate('status', e.target.value)} />
                            <InlineSelect label="Priority" value={liveTask.priority} options={['Low', 'Medium', 'High']} onChange={(e) => handleImmediateUpdate('priority', e.target.value)} />
                            <InlineSelect label="Assign To" value={liveTask.assignedTo || ''} options={[{value: '', label: 'Unassigned'}, ...team.map(m => ({value: m.uid, label: m.email}))]} onChange={(e) => handleImmediateUpdate('assignedTo', e.target.value)} />
                            <InlineDate label="Due Date" value={liveTask.scheduledDate} onChange={(e) => handleImmediateUpdate('scheduledDate', e.target.value)} />
                        </div>
                        {checklist && checklist.length > 0 && <div className="mb-6"><TaskChecklist items={checklist} onUpdate={handleChecklistItemUpdate} taskId={task.id} /></div>}
                        <div className="mb-6"><h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center"><Upload size={18} className="mr-2"/>General Proof of Completion</h4><p className="text-xs text-gray-500 dark:text-gray-400 mb-2">For tasks without a specific checklist, upload a general proof file here.</p><div className="flex items-center space-x-2"><input type="file" onChange={handleProofFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900"/><button onClick={handleProofUpload} className="button-primary" disabled={isUploadingProof || !proofFile}>{isUploadingProof ? 'Uploading...' : 'Upload'}</button></div></div>
                        <div><h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center"><MessageSquare size={18} className="mr-2"/>Activity & Comments</h4><div className="space-y-3 mb-4 max-h-48 overflow-y-auto">{comments.length > 0 ? comments.map(comment => (<div key={comment.id} className="text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg"><p className="text-gray-800 dark:text-gray-200">{comment.text}</p><p className="text-xs text-gray-400 dark:text-gray-500 mt-1">- {comment.author}</p>{comment.isProof && comment.proofURL && (<a href={comment.proofURL} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center mt-1"><Image size={12} className="mr-1" /> View Proof</a>)}</div>)) : <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>}</div><div className="flex space-x-2"><input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-grow input-style" /><button onClick={handleAddComment} className="button-primary px-4"><Plus size={16}/></button></div></div>
                    </div>
                    <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-gray-700 flex-shrink-0">
                        <button onClick={handleDelete} className="text-sm font-semibold text-red-600 hover:text-red-500 flex items-center"><Trash2 size={14} className="mr-1.5"/> Delete Task</button>
                        <button onClick={onClose} className="button-primary">Close</button>
                    </div>
                </div>
            </div>
        </>
    );
};

const InlineSelect = ({ label, value, options, onChange }) => (<div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label><select value={value} onChange={onChange} className="mt-1 w-full input-style text-sm py-1.5">{options.map(opt => (typeof opt === 'object' ? <option key={opt.value} value={opt.value}>{opt.label}</option> : <option key={opt} value={opt}>{opt}</option>))}</select></div>);
const InlineDate = ({ label, value, onChange }) => (<div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label><input type="date" value={value} onChange={onChange} className="mt-1 w-full input-style text-sm py-1.5" /></div>);

const TaskChecklist = ({ items, onUpdate, taskId }) => {
    const [expandedItem, setExpandedItem] = useState(null);
    const completedCount = items.filter(item => item.completed).length;
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

    const handleProofUpload = async (index, file) => {
        if (!file) return;
        const toastId = toast.loading(`Uploading proof for "${items[index].text}"...`);
        try {
            const proofRef = ref(storage, `checklist_proofs/${taskId}/${index}-${Date.now()}-${file.name}`);
            await uploadBytes(proofRef, file);
            const downloadURL = await getDownloadURL(proofRef);
            onUpdate(index, { proofUrl: downloadURL });
            toast.update(toastId, { render: "Proof uploaded!", type: "success", isLoading: false, autoClose: 2000 });
        } catch (error) {
            console.error("Checklist proof upload failed:", error);
            toast.update(toastId, { render: "Upload failed.", type: "error", isLoading: false, autoClose: 4000 });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center"><ListChecks size={18} className="mr-2"/>Checklist</h4><span className="text-sm font-medium text-gray-500 dark:text-gray-400">{completedCount} / {items.length} Complete</span></div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
            <ul className="space-y-2">{items.map((item, index) => (<li key={index} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border dark:border-gray-600"><div className="flex items-center justify-between"><div className="flex items-center"><input type="checkbox" checked={item.completed} onChange={() => onUpdate(index, { completed: !item.completed })} className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/><span className={`ml-3 text-sm font-medium ${item.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{item.text}</span>{item.proofRequired && <ShieldCheck size={14} className="ml-2 text-green-500" title="Proof Required"/>}</div>{(item.instructions || item.imageUrl) && (<button onClick={() => setExpandedItem(expandedItem === index ? null : index)} className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><ChevronDown size={20} className={`transition-transform ${expandedItem === index ? 'rotate-180' : ''}`} /></button>)}</div>{expandedItem === index && (<div className="mt-3 ml-3 pl-4 border-l-2 border-blue-500 animate-fade-in-down space-y-2"><div className="flex items-start"><Info size={14} className="mr-2 mt-1 flex-shrink-0 text-blue-500"/><div className="text-sm text-gray-600 dark:text-gray-300">{item.instructions.split('\n').map((line, i) => (<span key={i} className="block">{line}</span>))}</div></div>{item.imageUrl && <div className="pl-6"><img src={item.imageUrl} alt="Instructional" className="rounded-lg max-w-xs max-h-48 border dark:border-gray-600 shadow-sm" /></div>}</div>)}{item.proofRequired && <div className="mt-3 ml-8 pl-1 pt-3 border-t border-dashed dark:border-gray-600"><div className="flex items-center justify-between">{item.proofUrl ? <a href={item.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center"><Paperclip size={14} className="mr-1"/>View Uploaded Proof</a> : <span className="text-sm text-gray-500">No proof uploaded.</span>}<label htmlFor={`item-proof-${index}`} className="button-secondary-sm cursor-pointer">Upload Proof</label><input id={`item-proof-${index}`} type="file" onChange={(e) => handleProofUpload(index, e.target.files[0])} className="hidden" accept="image/*" /></div></div>}</li>))}</ul>
        </div>
    );
};

export const TemplateTaskModal = ({ templates, onClose, onAddTask }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState('weekly');
    const handleCreateTaskFromTemplate = () => {
        if (!selectedTemplateId) { toast.error('Please select a template.'); return; }
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) { toast.error('Selected template not found.'); return; }
        const taskData = { taskName: template.name, taskType: template.taskType || 'Cleaning', description: `Task created from template: ${template.name}`, priority: 'Medium', scheduledDate: '', assignedTo: '', assignedToEmail: '', templateId: template.id, templateName: template.name, checklistItems: template.items ? template.items.map(item => ({...item, completed: false, proofUrl: ''})) : [], recurring: { enabled: isRecurring, frequency: isRecurring ? recurringFrequency : null, isPrototype: isRecurring } };
        onAddTask(taskData);
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700"><h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Task from Template</h3><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a Template</label><select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="mt-1 w-full input-style"><option value="">-- Choose a template --</option>{templates.map(template => (<option key={template.id} value={template.id}>{template.name}</option>))}</select></div><div className="pt-4 border-t dark:border-gray-600 space-y-3"><div className="flex items-center"><input id="recurring-template-checkbox" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" /><label htmlFor="recurring-template-checkbox" className="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-200">Make this a recurring task</label></div>{isRecurring && (<div className="pl-6 animate-fade-in-down"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Repeat every</label><select value={recurringFrequency} onChange={e => setRecurringFrequency(e.target.value)} className="mt-1 w-full md:w-1/2 input-style"><option value="daily">Day</option><option value="weekly">Week</option><option value="monthly">Month</option></select></div>)}</div></div><div className="flex justify-end space-x-2 pt-6 mt-4 border-t dark:border-gray-700"><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="button" onClick={handleCreateTaskFromTemplate} className="button-primary">Create Task</button></div></div></div>
    );
};
