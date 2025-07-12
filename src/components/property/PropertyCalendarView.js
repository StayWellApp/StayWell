// src/components/property/PropertyCalendarView.js
// This component displays the calendar view for a property.

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import { AddTaskForm } from './TaskComponents';

export const CalendarView = ({ property, user }) => {
    const [events, setEvents] = useState([]);
    const [newCalLink, setNewCalLink] = useState("");
    
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [team, setTeam] = useState([]);
    const [checklistTemplates, setChecklistTemplates] = useState([]);

    useEffect(() => {
        if (!user) return;
        const checklistsQuery = query(collection(db, "checklistTemplates"), where("ownerId", "==", user.uid));
        const checklistsUnsubscribe = onSnapshot(checklistsQuery, (snapshot) => {
            setChecklistTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching checklist templates for calendar:", error);
            toast.error("Could not load checklist templates.");
        });

        const teamQuery = query(collection(db, 'users'), where('ownerId', '==', user.uid));
        const teamUnsubscribe = onSnapshot(teamQuery, snapshot => {
            setTeam(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        }, (error) => {
            console.error("Error fetching team for calendar:", error);
            toast.error("Could not load team data.");
        });

        return () => {
            checklistsUnsubscribe();
            teamUnsubscribe();
        };
    }, [user]);

    useEffect(() => {
        const bookingEvents = [
            { id: 'booking-001', title: `Guest: John Doe`, start: '2025-07-10T14:00:00', end: '2025-07-15T11:00:00', backgroundColor: '#3b82f6', borderColor: '#2563eb' },
            { id: 'booking-002', title: `Guest: Jane Smith`, start: '2025-07-22', end: '2025-07-28', backgroundColor: '#3b82f6', borderColor: '#2563eb' },
        ];

        const tasksQuery = query(collection(db, "tasks"), where("propertyId", "==", property.id));
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const taskEvents = snapshot.docs.map(doc => {
                const task = doc.data();
                return {
                    id: doc.id,
                    title: `Task: ${task.taskName}`,
                    start: task.scheduledDate,
                    allDay: true,
                    backgroundColor: '#10b981',
                    borderColor: '#059669'
                };
            }).filter(event => event.start);

            setEvents([...bookingEvents, ...taskEvents]);
        }, (error) => {
            console.error("Error fetching tasks for calendar:", error);
            toast.error("Could not load tasks on the calendar.");
        });

        return () => unsubscribe();
    }, [property.id]);

    const handleDateClick = (arg) => {
        setSelectedDate(arg.dateStr);
        setShowAddTaskForm(true);
    };

    const handleAddTask = async (taskData) => {
        const toastId = toast.loading("Adding task...");
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

    const handleAddCalendarLink = async (e) => {
        e.preventDefault();
        if (!newCalLink.startsWith("https") || !newCalLink.endsWith(".ics")) {
            toast.error("Please enter a valid iCal link (must start with https and end with .ics).");
            return;
        }
        const toastId = toast.loading("Syncing calendar...");
        try {
            const propertyRef = doc(db, "properties", property.id);
            await updateDoc(propertyRef, { calendarLinks: arrayUnion(newCalLink) });
            toast.update(toastId, { 
                render: "Calendar synced successfully!", 
                type: "success", 
                isLoading: false, 
                autoClose: 3000 
            });
            setNewCalLink("");
        } catch (error) {
            console.error("Error adding calendar link:", error);
            toast.update(toastId, { 
                render: "Failed to sync calendar.", 
                type: "error", 
                isLoading: false, 
                autoClose: 5000 
            });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {showAddTaskForm && (
                <div className="mb-6">
                    <AddTaskForm 
                        onAddTask={handleAddTask} 
                        onCancel={() => setShowAddTaskForm(false)}
                        checklistTemplates={checklistTemplates} 
                        team={team}
                        preselectedDate={selectedDate}
                    />
                     <hr className="my-6 border-gray-200 dark:border-gray-700"/>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Unified Calendar</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click a date to add a task, or use the button.</p>
                </div>
                <button 
                    onClick={() => {
                        setSelectedDate(null);
                        setShowAddTaskForm(true);
                    }}
                    className="button-primary"
                >
                    <Plus size={18} className="mr-2" />
                    New Task
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 -m-2 md:p-0 md:m-0">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    editable={false}
                    dayMaxEvents={true}
                    weekends={true}
                    dateClick={handleDateClick}
                />
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Sync Calendars (iCal)</h4>
                <form onSubmit={handleAddCalendarLink} className="flex space-x-2">
                    <input
                        type="url"
                        value={newCalLink}
                        onChange={e => setNewCalLink(e.target.value)}
                        placeholder="Paste iCal link..."
                        className="input-style flex-grow"
                    />
                    <button type="submit" className="button-secondary">Add</button>
                </form>
                <ul className="mt-3 space-y-2">
                    {property.calendarLinks && property.calendarLinks.map((link, index) => (
                        <li key={index} className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border dark:border-gray-700 truncate">{link}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
