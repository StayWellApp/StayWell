// src/components/property/PropertyTasksView.js
// This component displays the tasks for a specific property.

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Plus, ListChecks } from 'lucide-react';
import { AddTaskForm, TaskDetailModal, TemplateTaskModal } from './TaskComponents';

export const TasksView = ({ property, user }) => {
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [team, setTeam] = useState([]);
    const [checklistTemplates, setChecklistTemplates] = useState([]);

    useEffect(() => {
        const tasksQuery = query(collection(db, "tasks"), where("propertyId", "==", property.id));
        const tasksUnsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const sortedTasks = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setTasks(sortedTasks);
            setLoadingTasks(false);
        }, (error) => {
            console.error("Error fetching tasks:", error);
            toast.error("Could not load tasks.");
            setLoadingTasks(false);
        });

        const checklistsQuery = query(collection(db, "checklistTemplates"), where("ownerId", "==", user.uid));
        const checklistsUnsubscribe = onSnapshot(checklistsQuery, (snapshot) => {
            const relevantTemplates = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(template => 
                !template.linkedProperties || 
                template.linkedProperties.length === 0 || 
                template.linkedProperties.includes(property.id)
              );
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
        
        return () => {
            tasksUnsubscribe();
            checklistsUnsubscribe();
            teamUnsubscribe();
        };
    }, [property.id, user.uid]);

    const handleAddTask = async (taskData) => {
        const toastId = toast.loading("Adding new task...");
        try {
            await addDoc(collection(db, "tasks"), { 
                ...taskData, 
                propertyId: property.id, 
                propertyName: property.propertyName, 
                propertyAddress: property.address, 
                ownerId: user.uid, 
                status: 'Pending', 
                createdAt: serverTimestamp() 
            });
            toast.update(toastId, { 
                render: "Task added successfully!", 
                type: "success", 
                isLoading: false, 
                autoClose: 3000 
            });
            setShowAddTaskForm(false);
            setShowTemplateModal(false);
        } catch (error) {
            console.error("Error adding task: ", error);
            toast.update(toastId, { 
                render: "Failed to add task.", 
                type: "error", 
                isLoading: false, 
                autoClose: 5000 
            });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Tasks</h3>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setShowTemplateModal(true)} className="button-secondary">
                        <ListChecks size={16} className="mr-2" />
                        Add from Template
                    </button>
                    <button onClick={() => setShowAddTaskForm(true)} className="button-primary">
                        <Plus size={18} className="mr-2" />
                        Add New Task
                    </button>
                </div>
            </div>
            
            {showAddTaskForm && <AddTaskForm onAddTask={handleAddTask} onCancel={() => setShowAddTaskForm(false)} checklistTemplates={checklistTemplates} team={team} />}
            {showTemplateModal && <TemplateTaskModal templates={checklistTemplates} onClose={() => setShowTemplateModal(false)} onAddTask={handleAddTask} />}

            <div className="mt-4 border-t border-gray-200 dark:border-gray-700">
                {loadingTasks ? <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading tasks...</p> : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tasks.length > 0 ? tasks.map(task => (
                            <li key={task.id} onClick={() => setSelectedTask(task)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{task.taskName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{task.taskType} {task.templateName && `- ${task.templateName}`}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{task.assignedToEmail ? `Assigned to: ${task.assignedToEmail}`: 'Unassigned'}</p>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${task.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>{task.status}</span>
                            </li>
                        )) : <p className="text-center py-8 text-gray-500 dark:text-gray-400">No tasks for this property yet.</p>}
                    </ul>
                )}
            </div>
            {selectedTask && <TaskDetailModal task={selectedTask} team={team} onClose={() => setSelectedTask(null)} />}
        </div>
    );
};
