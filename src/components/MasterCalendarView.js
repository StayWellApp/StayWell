// --- src/components/MasterCalendarView.js ---
// Replace the entire contents of this file.

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

        const tasksQuery = query(collection(db, "tasks"), where("ownerId", "==", user.uid));
        
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const taskEvents = snapshot.docs.map(doc => {
                const task = doc.data();
                return {
                    id: doc.id,
                    title: `[${task.propertyName}] ${task.taskName}`,
                    start: task.scheduledDate,
                    allDay: true,
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    extendedProps: {
                        propertyId: task.propertyId,
                        propertyName: task.propertyName,
                        type: 'task'
                    }
                };
            }).filter(event => event.start);

            setEvents(taskEvents);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleEventClick = (clickInfo) => {
        alert(`Event: ${clickInfo.event.title}\nProperty: ${clickInfo.event.extendedProps.propertyName}`);
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Master Calendar</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">A unified view of all tasks and bookings across your properties.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                {loading ? (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">Loading calendar events...</div>
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
