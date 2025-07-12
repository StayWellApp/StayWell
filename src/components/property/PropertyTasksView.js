// src/components/property/PropertyTasksView.js
// This component displays the tasks for a specific property.
// MODIFIED to include search, filtering, and a Kanban-style board view.

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Plus, ListChecks, Search, Repeat, ChevronDown, Calendar } from 'lucide-react';
import { AddTaskForm, TaskDetailModal, TemplateTaskModal } from './TaskComponents';

// --- NEW: Task Card Component ---
const TaskCard = ({ task, onClick }) => {
    const priorityColors = {
        High: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    };

    return (
        <div onClick={onClick} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{task.taskName}</p>
                {task.recurring?.enabled && <Repeat size={14} className="text-gray-400 flex-shrink-0" title={`Repeats ${task.recurring.frequency}`} />}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{task.taskType}</p>
            <div className="mt-3 flex justify-between items-center">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>{task.priority} Priority</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{task.assignedToEmail || 'Unassigned'}</span>
            </div>
        </div>
    );
};

// --- NEW: Kanban Column Component ---
const KanbanColumn = ({ title, tasks, onTaskClick }) => {
    const statusStyles = {
        Pending: "border-yellow-500",
        "In Progress": "border-blue-500",
        Completed: "border-green-500",
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 flex-1 flex flex-col">
            <h4 className={`font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 ${statusStyles[title]}`}>{title}</h4>
            <div className="space-y-3 flex-grow overflow-y-auto">
                {tasks.length > 0 ? (
                    tasks.map(task => <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />)
                ) : (
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 pt-4">No tasks in this status.</p>
                )}
            </div>
        </div>
    );
};


export const TasksView = ({ property, user }) => {
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [team, setTeam] = useState([]);
    const [checklistTemplates, setChecklistTemplates] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showRecurring, setShowRecurring] = useState(false);

    useEffect(() => {
        const tasksQuery = query(collection(db, "tasks"), where("propertyId", "==", property.id));
        const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const sortedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setTasks(sortedTasks);
            setLoadingTasks(false);
        }, (error) => {
            console.error("Error fetching tasks:", error);
            toast.error("Could not load tasks.");
            setLoadingTasks(false);
        });

        const checklistsQuery = query(collection(db, "checklistTemplates"), where("ownerId", "==", user.uid));
        const checklistsUnsubscribe = onSnapshot(checklistsQuery, (snapshot) => {
            const relevantTemplates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(template => !template.linkedProperties || template.linkedProperties.length === 0 || template.linkedProperties.includes(property.id));
            setChecklistTemplates(relevantTemplates);
        }, (error) => {
            console.error("Error fetching checklist templates:", error);
            toast.error("Could not load checklist templates.");
        });

        const teamQuery = query(collection(db, 'users'), where('ownerId', '==', user.uid));
        const teamUnsubscribe = onSnapshot(teamQuery, snapshot => {
            setTeam(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        }, (error) => {
            console.error("Error fetching team members:", error);
            toast.error("Could not load team data.");
        });
        
        return () => { tasksUnsubscribe(); checklistsUnsubscribe(); teamUnsubscribe(); };
    }, [property.id, user.uid]);

    const handleAddTask = async (taskData) => {
        const toastId = toast.loading("Adding new task...");
        try {
            await addDoc(collection(db, "tasks"), { ...taskData, propertyId: property.id, propertyName: property.propertyName, propertyAddress: property.address, ownerId: user.uid, status: 'Pending', createdAt: serverTimestamp() });
            toast.update(toastId, { render: "Task added successfully!", type: "success", isLoading: false, autoClose: 3000 });
            setShowAddTaskForm(false);
            setShowTemplateModal(false);
        } catch (error) {
            console.error("Error adding task: ", error);
            toast.update(toastId, { render: "Failed to add task.", type: "error", isLoading: false, autoClose: 5000 });
        }
    };

    const activeTasks = useMemo(() => {
        return tasks.filter(task => !task.recurring?.isPrototype);
    }, [tasks]);

    const recurringPrototypes = useMemo(() => {
        return tasks.filter(task => task.recurring?.isPrototype);
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return activeTasks
            .filter(task => statusFilter === 'All' || task.status === statusFilter)
            .filter(task => task.taskName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activeTasks, statusFilter, searchTerm]);

    const groupedTasks = {
        Pending: filteredTasks.filter(t => t.status === 'Pending'),
        'In Progress': filteredTasks.filter(t => t.status === 'In Progress'),
        Completed: filteredTasks.filter(t => t.status === 'Completed'),
    };

    const FilterButton = ({ status }) => (
        <button onClick={() => setStatusFilter(status)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${statusFilter === status ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
            {status}
        </button>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Task Board</h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setShowTemplateModal(true)} className="button-secondary"><ListChecks size={16} className="mr-2" /> Add from Template</button>
                        <button onClick={() => setShowAddTaskForm(true)} className="button-primary"><Plus size={18} className="mr-2" /> Add New Task</button>
                    </div>
                </div>
                
                {showAddTaskForm && <AddTaskForm onAddTask={handleAddTask} onCancel={() => setShowAddTaskForm(false)} checklistTemplates={checklistTemplates} team={team} />}
                {showTemplateModal && <TemplateTaskModal templates={checklistTemplates} onClose={() => setShowTemplateModal(false)} onAddTask={handleAddTask} />}

                <div className="flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm">
                    <div className="relative w-full md:w-1/3 mb-4 md:mb-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" placeholder="Search tasks by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-style pl-10 w-full" />
                    </div>
                    <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                        <FilterButton status="All" />
                        <FilterButton status="Pending" />
                        <FilterButton status="In Progress" />
                        <FilterButton status="Completed" />
                    </div>
                </div>
            </div>
            
            <div className="flex-grow min-h-0">
                {loadingTasks ? <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading tasks...</p> : (
                    <div className="flex flex-col md:flex-row gap-6 h-full">
                        <KanbanColumn title="Pending" tasks={groupedTasks.Pending} onTaskClick={setSelectedTask} />
                        <KanbanColumn title="In Progress" tasks={groupedTasks['In Progress']} onTaskClick={setSelectedTask} />
                        <KanbanColumn title="Completed" tasks={groupedTasks.Completed} onTaskClick={setSelectedTask} />
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 mt-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm">
                    <button onClick={() => setShowRecurring(!showRecurring)} className="w-full flex justify-between items-center p-4">
                        <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 flex items-center"><Repeat size={18} className="mr-3" /> Scheduled Recurring Tasks</h4>
                        <ChevronDown size={20} className={`transition-transform ${showRecurring ? 'rotate-180' : ''}`} />
                    </button>
                    {showRecurring && (
                        <div className="p-4 border-t dark:border-gray-700 animate-fade-in-down">
                            {recurringPrototypes.length > 0 ? (
                                <ul className="space-y-2">
                                    {recurringPrototypes.map(task => (
                                        <li key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{task.taskName}</p>
                                                <p className="text-sm text-gray-500">Repeats {task.recurring.frequency}</p>
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center">
                                                <Calendar size={14} className="mr-2" />
                                                <span>Next due: {task.scheduledDate || 'Not set'}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">No recurring tasks have been set up.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {selectedTask && <TaskDetailModal task={selectedTask} team={team} user={user} onClose={() => setSelectedTask(null)} />}
        </div>
    );
};
