// --- src/components/MasterCalendarView.js ---
// This file is updated to show both bookings and tasks.

import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toast } from 'react-toastify';

const MasterCalendarView = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        
        // Query for tasks assigned to the user
        const tasksQuery = query(collection(db, "tasks"), where("ownerId", "==", user.uid));
        
        // Query for bookings related to the user's properties
        const bookingsQuery = query(collection(db, "bookings"), where("ownerId", "==", user.uid));

        const unsubscribeTasks = onSnapshot(tasksQuery, (tasksSnapshot) => {
            const taskEvents = tasksSnapshot.docs.map(doc => {
                const task = doc.data();
                return {
                    id: doc.id,
                    title: `Task: ${task.taskName}`,
                    start: task.scheduledDate,
                    allDay: true,
                    backgroundColor: '#10b981', // Green for tasks
                    borderColor: '#059669',
                    extendedProps: { type: 'task', ...task }
                };
            }).filter(event => event.start);

            // Combine with existing events from bookings
            setEvents(currentEvents => [
                ...currentEvents.filter(e => e.extendedProps.type !== 'task'), 
                ...taskEvents
            ]);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tasks:", error);
            toast.error("Could not load tasks for calendar.");
            setLoading(false);
        });

        const unsubscribeBookings = onSnapshot(bookingsQuery, (bookingsSnapshot) => {
            const bookingEvents = bookingsSnapshot.docs.map(doc => {
                const booking = doc.data();
                return {
                    id: doc.id,
                    title: `Booking: ${booking.guestName}`,
                    start: booking.startDate,
                    end: booking.endDate, // Use start and end for multi-day events
                    allDay: true,
                    backgroundColor: '#3b82f6', // Blue for bookings
                    borderColor: '#2563eb',
                    extendedProps: { type: 'booking', ...booking }
                };
            }).filter(event => event.start);

            // Combine with existing events from tasks
            setEvents(currentEvents => [
                ...currentEvents.filter(e => e.extendedProps.type !== 'booking'), 
                ...bookingEvents
            ]);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings:", error);
            toast.error("Could not load bookings for calendar.");
            setLoading(false);
        });

        return () => {
            unsubscribeTasks();
            unsubscribeBookings();
        };
    }, [user]);

    const handleEventClick = (clickInfo) => {
        const props = clickInfo.event.extendedProps;
        if (props.type === 'booking') {
            alert(`Booking for: ${props.guestName}\nProperty: ${props.propertyName}\nDates: ${props.startDate} to ${props.endDate}`);
        } else {
            alert(`Task: ${clickInfo.event.title}\nProperty: ${props.propertyName}\nDue: ${props.scheduledDate}`);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Master Calendar</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">A unified view of all tasks and bookings across your properties.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                {loading && events.length === 0 ? (
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