import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../../firebase-config';
import { doc, updateDoc, deleteDoc, serverTimestamp, addDoc, collection, onSnapshot, query } from 'firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Trash2, Plus, MessageSquare, ListChecks, Info, Image, ChevronDown, Repeat, Edit, X, ShieldCheck, Paperclip } from 'lucide-react';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

// --- NEW (MERGED): Task Summary Card for Lists ---
// Use this component in PropertyTasksView.js to list all tasks.
// The `onTaskClick` prop should open the TaskDetailModal for the clicked task.
export const TaskCard = ({ task, onTaskClick }) => {
    const getPriorityPill = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-800 border-red-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusPill = (status) => {
        switch (status) {
          case 'Pending': return 'bg-yellow-200 text-yellow-800';
          case 'In Progress': return 'bg-indigo-200 text-indigo-800';
          case 'Completed':
          case 'Approved': return 'bg-green-200 text-green-800';
          case 'Pending Inspection': return 'bg-blue-200 text-blue-800';
          case 'Requires Revisions': return 'bg-red-200 text-red-800';
          default: return 'bg-gray-200 text-gray-800';
        }
    };
    
    return (
        <div 
            onClick={() => onTaskClick(task)} 
            className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-4 border dark:border-gray-700 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer"
        >
            <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        {task.recurring?.enabled && <Repeat size={14} className="text-gray-400" title="Recurring Task" />}
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{task.taskName}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate w-full max-w-md">{task.description}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 ml-4">
                     <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusPill(task.status)}`}>
                        {task.status}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Due: {task.scheduledDate || 'Not set'}
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t dark:border-gray-700">
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getPriorityPill(task.priority)}`}>{task.priority} Priority</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">|</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Assignee: {task.assignedToEmail || 'Unassigned'}</span>
                </div>
                 <div className="text-xs text-gray-500 dark:text-gray-400">Click to view details</div>
            </div>
        </div>
    );
};


// --- Advanced Recurring Settings Component ---
const RecurringSettings = ({ recurringConfig, setRecurringConfig }) => {
    const handleFrequencyChange = (e) => {
        const newFrequency = e.target.value;
        setRecurringConfig(prev => ({
            ...prev,
            frequency: newFrequency,
            // Reset specific day settings when frequency changes
            daysOfWeek: newFrequency === 'weekly' ? { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false } : prev.daysOfWeek,
        }));
    };

    const handleIntervalChange = (e) => {
        setRecurringConfig(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }));
    };

    const handleDayOfWeekToggle = (day) => {
        setRecurringConfig(prev => ({
            ...prev,
            daysOfWeek: {
                ...prev.daysOfWeek,
                [day]: !prev.daysOfWeek[day]
            }
        }));
    };

    const DayButton = ({ day, label }) => (
        <button
            type="button"
            onClick={() => handleDayOfWeekToggle(day)}
            className={`px-2 py-1 text-xs rounded-full border ${recurringConfig.daysOfWeek[day] ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-gray-700 hover:border-blue-400'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Repeat every</label>
                    <input type="number" min="1" value={recurringConfig.interval} onChange={handleIntervalChange} className="mt-1 w-full input-style" />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                    <select value={recurringConfig.frequency} onChange={handleFrequencyChange} className="mt-1 w-full input-style">
                        <option value="daily">Day(s)</option>
                        <option value="weekly">Week(s)</option>
                        <option value="monthly">Month(s)</option>
                    </select>
                </div>
            </div>
            {recurringConfig.frequency === 'weekly' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">On these days</label>
                    <div className="flex flex-wrap gap-2">
                        <DayButton day="sun" label="S" />
                        <DayButton day="mon" label="M" />
                        <DayButton day="tue" label="T" />
                        <DayButton day="wed" label="W" />
                        <DayButton day="thu" label="T" />
                        <DayButton day="fri" label="F" />
                        <DayButton day="sat" label="S" />
                    </div>
                </div>
            )}
        </div>
    );
};


export const AddTaskForm = ({ onAddTask, onCancel, checklistTemplates, team, preselectedDate }) => {
    const [taskName, setTaskName] = useState('');
    const [taskType, setTaskType] = useState('Maintenance');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [scheduledDate, setScheduledDate] = useState(preselectedDate || '');
    const [assignedTo, setAssignedTo] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);

    const [recurringConfig, setRecurringConfig] = useState({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false }
    });

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
                isPrototype: isRecurring,
                ...recurringConfig
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
                           <RecurringSettings recurringConfig={recurringConfig} setRecurringConfig={setRecurringConfig} />
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
    const handleSave = () => { onSave({ taskName, description }); };
    return (<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 animate-fade-in"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700"><h3 className="text-xl font-semibold mb-4">Edit Task Details</h3><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Name</label><input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} className="mt-1 w-full input-style" /></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full input-style" rows="4"></textarea></div></div><div className="flex justify-end space-x-2 pt-6 mt-4 border-t dark:border-gray-700"><button type="button" onClick={onCancel} className="button-secondary">Cancel</button><button type="button" onClick={handleSave} className="button-primary">Save Changes</button></div></div></div>);
};

export const TaskDetailModal = ({ task, team, user, onClose }) => {
    const [liveTask, setLiveTask] = useState(task);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [checklist, setChecklist] = useState([]);
    const [isEditingDetails, setIsEditingDetails] = useState(false);

    // FIXED: The function passed to useCallback is now inline and dependencies are specified.
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
        const commentsQuery = query(collection(db, `tasks/${task.id}/comments`), { orderBy: ["createdAt", "desc"] });
        const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            setComments(fetchedComments);
        }, (error) => {
            console.error("Error fetching comments:", error);
            toast.error("Could not load comments.");
        });
        return () => { unsubscribeTask(); unsubscribeComments(); };
    }, [task.id]);

    const addActivityLog = async (text) => {
        try {
            await addDoc(collection(db, `tasks/${task.id}/comments`), {
                text,
                author: user?.displayName || user?.email || "System",
                createdAt: serverTimestamp(),
                isActivityLog: true,
            });
        } catch (error) {
            console.error("Failed to add activity log:", error);
        }
    };

    const createNextRecurringTask = async (completedTask) => {
        const { recurring, ...originalTaskData } = completedTask;
        if (!recurring?.enabled || !originalTaskData.scheduledDate) return;
        let nextDueDate = new Date(originalTaskData.scheduledDate + 'T00:00:00');
        if (isNaN(nextDueDate.getTime())) { console.warn("Cannot create recurring task: invalid original due date."); return; }
        const interval = recurring.interval || 1;
        if (recurring.frequency === 'daily') nextDueDate.setDate(nextDueDate.getDate() + interval);
        else if (recurring.frequency === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + (interval * 7));
        else if (recurring.frequency === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + interval);
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
                return;
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
        const oldItem = newChecklist[index];
        newChecklist[index] = { ...oldItem, ...updatedItemData };
        setChecklist(newChecklist);
        if (updatedItemData.completed !== undefined && updatedItemData.completed !== oldItem.completed) {
            const logText = updatedItemData.completed ? `Completed item: "${newChecklist[index].text}"` : `Marked item as incomplete: "${newChecklist[index].text}"`;
            addActivityLog(logText);
        }
        try {
            await updateDoc(doc(db, 'tasks', task.id), { checklistItems: newChecklist });
        } catch (error) {
            console.error("Error updating checklist:", error);
            toast.error("Could not save checklist change.");
        }
    };

    const handleChecklistProofUpload = async (index, file) => {
        if (!file) return;
        const toastId = toast.loading(`Uploading proof for "${checklist[index].text}"...`);
        try {
            const proofRef = ref(storage, `checklist_proofs/${task.id}/${index}-${Date.now()}-${file.name}`);
            await uploadBytes(proofRef, file);
            const downloadURL = await getDownloadURL(proofRef);
            const newChecklist = [...checklist];
            newChecklist[index].proofUrl = downloadURL;
            setChecklist(newChecklist);
            await updateDoc(doc(db, 'tasks', task.id), { checklistItems: newChecklist });
            addActivityLog(`Uploaded proof for: "${newChecklist[index].text}"`);
            toast.update(toastId, { render: "Proof uploaded!", type: "success", isLoading: false, autoClose: 2000 });
        } catch (error) {
            console.error("Checklist proof upload failed:", error);
            toast.update(toastId, { render: "Upload failed.", type: "error", isLoading: false, autoClose: 4000 });
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
                            {liveTask.recurring?.enabled && <Repeat size={18} className="text-gray-400" title={`Repeats every ${liveTask.recurring.interval} ${liveTask.recurring.frequency}`} />}
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
                        {checklist && checklist.length > 0 && <div className="mb-6"><TaskChecklist items={checklist} onUpdate={handleChecklistItemUpdate} onProofUpload={handleChecklistProofUpload} taskId={task.id} /></div>}

                        <div><h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center"><MessageSquare size={18} className="mr-2"/>Activity & Comments</h4><div className="space-y-3 mb-4 max-h-48 overflow-y-auto">{comments.length > 0 ? comments.map(comment => (<div key={comment.id} className={`text-sm p-3 rounded-lg ${comment.isActivityLog ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-gray-50 dark:bg-gray-700/50'}`}><p className="text-gray-800 dark:text-gray-200">{comment.text}</p><p className="text-xs text-gray-400 dark:text-gray-500 mt-1">- {comment.author} at {new Date(comment.createdAt?.toDate()).toLocaleString()}</p>{comment.isProof && comment.proofURL && (<a href={comment.proofURL} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center mt-1"><Image size={12} className="mr-1" /> View Proof</a>)}</div>)) : <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>}</div><div className="flex space-x-2"><input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-grow input-style" /><button onClick={handleAddComment} className="button-primary px-4"><Plus size={16}/></button></div></div>
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

const TaskChecklist = ({ items, onUpdate, onProofUpload }) => {
    const [expandedItem, setExpandedItem] = useState(null);
    const completedCount = items.filter(item => item.completed).length;
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center"><ListChecks size={18} className="mr-2"/>Checklist</h4><span className="text-sm font-medium text-gray-500 dark:text-gray-400">{completedCount} / {items.length} Complete</span></div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
            <ul className="space-y-2">{items.map((item, index) => (<li key={index} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border dark:border-gray-600"><div className="flex items-center justify-between"><div className="flex items-center"><input type="checkbox" checked={item.completed} onChange={() => onUpdate(index, { completed: !item.completed })} className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"/><span className={`ml-3 text-sm font-medium ${item.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{item.text}</span>{item.proofRequired && <ShieldCheck size={14} className="ml-2 text-green-500" title="Proof Required"/>}</div>{(item.instructions || item.imageUrl) && (<button onClick={() => setExpandedItem(expandedItem === index ? null : index)} className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><ChevronDown size={20} className={`transition-transform ${expandedItem === index ? 'rotate-180' : ''}`} /></button>)}</div>{expandedItem === index && (<div className="mt-3 ml-3 pl-4 border-l-2 border-blue-500 animate-fade-in-down space-y-2"><div className="flex items-start"><Info size={14} className="mr-2 mt-1 flex-shrink-0 text-blue-500"/><div className="text-sm text-gray-600 dark:text-gray-300">{item.instructions.split('\n').map((line, i) => (<span key={i} className="block">{line}</span>))}</div></div>{item.imageUrl && <div className="pl-6"><img src={item.imageUrl} alt="Instructional" className="rounded-lg max-w-xs max-h-48 border dark:border-gray-600 shadow-sm" /></div>}</div>)}{item.proofRequired && <div className="mt-3 ml-8 pl-1 pt-3 border-t border-dashed dark:border-gray-600"><div className="flex items-center justify-between">{item.proofUrl ? <a href={item.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline flex items-center"><Paperclip size={14} className="mr-1"/>View Uploaded Proof</a> : <span className="text-sm text-gray-500">No proof uploaded.</span>}<label htmlFor={`item-proof-${index}`} className="button-secondary-sm cursor-pointer">Upload Proof</label><input id={`item-proof-${index}`} type="file" onChange={(e) => onProofUpload(index, e.target.files[0])} className="hidden" accept="image/*" /></div></div>}</li>))}</ul>
        </div>
    );
};

export const TemplateTaskModal = ({ templates, onClose, onAddTask }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringConfig, setRecurringConfig] = useState({ frequency: 'weekly', interval: 1, daysOfWeek: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false } });
    const handleCreateTaskFromTemplate = () => {
        if (!selectedTemplateId) { toast.error('Please select a template.'); return; }
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) { toast.error('Selected template not found.'); return; }
        const taskData = { taskName: template.name, taskType: template.taskType || 'Cleaning', description: `Task created from template: ${template.name}`, priority: 'Medium', scheduledDate: '', assignedTo: '', assignedToEmail: '', templateId: template.id, templateName: template.name, checklistItems: template.items ? template.items.map(item => ({...item, completed: false, proofUrl: ''})) : [], recurring: { enabled: isRecurring, isPrototype: isRecurring, ...recurringConfig } };
        onAddTask(taskData);
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in"><div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700"><h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Add Task from Template</h3><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a Template</label><select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="mt-1 w-full input-style"><option value="">-- Choose a template --</option>{templates.map(template => (<option key={template.id} value={template.id}>{template.name}</option>))}</select></div><div className="pt-4 border-t dark:border-gray-600 space-y-3"><div className="flex items-center"><input id="recurring-template-checkbox" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" /><label htmlFor="recurring-template-checkbox" className="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-200">Make this a recurring task</label></div>{isRecurring && (<div className="pl-6 animate-fade-in-down"><RecurringSettings recurringConfig={recurringConfig} setRecurringConfig={setRecurringConfig} /></div>)}</div></div><div className="flex justify-end space-x-2 pt-6 mt-4 border-t dark:border-gray-700"><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="button" onClick={handleCreateTaskFromTemplate} className="button-primary">Create Task</button></div></div></div>
    );
};

export const ActivateRecurringTaskModal = ({ task, team, onActivate, onCancel }) => {
    const [assignedTo, setAssignedTo] = useState('');
    const [scheduledDate, setScheduledDate] = useState(task.scheduledDate || '');

    const handleActivate = () => {
        if (!assignedTo) {
            toast.error("Please assign this task to a team member.");
            return;
        }
        if (!scheduledDate) {
            toast.error("Please set a due date for this task instance.");
            return;
        }
        onActivate(task, { assignedTo, scheduledDate });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-2">Activate Recurring Task</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Assign "{task.taskName}" for the next cycle.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Next Due Date</label>
                        <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="mt-1 w-full input-style" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign To</label>
                        <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="mt-1 w-full input-style">
                            <option value="">-- Select a team member --</option>
                            {team.map(member => <option key={member.id} value={member.uid}>{member.email}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-6 mt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onCancel} className="button-secondary">Cancel</button>
                    <button type="button" onClick={handleActivate} className="button-primary">Activate & Assign</button>
                </div>
            </div>
        </div>
    );
};