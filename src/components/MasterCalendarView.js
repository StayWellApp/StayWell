// --- src/components/MasterCalendarView.js ---
// Create this new file.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const MasterCalendarView = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Query for all tasks owned by the user, across all properties
        const tasksQuery = query(collection(db, "tasks"), where("ownerId", "==", user.uid));
        
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const taskEvents = snapshot.docs.map(doc => {
                const task = doc.data();
                return {
                    id: doc.id,
                    // Add property name to the title for clarity
                    title: `[${task.propertyName}] ${task.taskName}`,
                    start: task.scheduledDate,
                    allDay: true,
                    backgroundColor: '#10b981', // Green for tasks
                    borderColor: '#059669',
                    extendedProps: {
                        propertyId: task.propertyId,
                        propertyName: task.propertyName,
                        type: 'task'
                    }
                };
            }).filter(event => event.start);

            // Here you would also fetch and combine booking events from all properties
            // For now, we'll just use the tasks.
            setEvents(taskEvents);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleEventClick = (clickInfo) => {
        // In the future, this could open the task or booking detail modal
        alert(`Event: ${clickInfo.event.title}\nProperty: ${clickInfo.event.extendedProps.propertyName}`);
    };

    return (
        <div className="p-8 bg-gray-50 min-h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Master Calendar</h1>
                <p className="text-gray-600 mt-1">A unified view of all tasks and bookings across your properties.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading calendar events...</div>
                ) : (
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
                        eventClick={handleEventClick}
                    />
                )}
            </div>
        </div>
    );
};

export default MasterCalendarView;
