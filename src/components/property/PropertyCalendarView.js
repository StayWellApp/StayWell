// src/components/property/PropertyCalendarView.js
// FINAL VERSION: Includes interactive modals for all event types.

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase-config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';
import { Trash, X } from 'lucide-react';
import { TaskDetailModal } from '../TaskViews'; // Import Task Modal
import { BookingDetailModal } from './BookingDetailModal'; // Import Booking Modal

const localizer = momentLocalizer(moment);

// Custom Toolbar (no changes)
const CustomToolbar = (toolbar) => {
    const goToBack = () => {
        toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
        toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
        toolbar.onNavigate('TODAY');
    };

    const label = () => {
        const date = moment(toolbar.date);
        return (
            <span>
                <strong>{date.format('MMMM')}</strong>
                <span> {date.format('YYYY')}</span>
            </span>
        );
    };

    return (
        <div className="rbc-toolbar p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <span className="rbc-btn-group">
                <button type="button" onClick={goToCurrent} className="button-secondary text-sm">Today</button>
                <button type="button" onClick={goToBack} className="button-secondary text-sm">Back</button>
                <button type="button" onClick={goToNext} className="button-secondary text-sm">Next</button>
            </span>
            <span className="rbc-toolbar-label text-lg font-bold text-gray-800 dark:text-gray-100">{label()}</span>
            <span className="rbc-btn-group">
                 <button type="button" className="button-primary text-sm" onClick={() => toolbar.onView('month')}>Month</button>
                 <button type="button" className="button-secondary text-sm" onClick={() => toolbar.onView('week')}>Week</button>
                 <button type="button" className="button-secondary text-sm" onClick={() => toolbar.onView('day')}>Day</button>
            </span>
        </div>
    );
};

// Main Calendar View Component
export const CalendarView = ({ property, user }) => {
    // Event data states
    const [manualEvents, setManualEvents] = useState([]);
    const [syncedBookings, setSyncedBookings] = useState([]);
    const [automatedTasks, setAutomatedTasks] = useState([]);
    const [team, setTeam] = useState([]); // State for team members

    // Modal control states
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    
    // Data for modals
    const [selectedManualEvent, setSelectedManualEvent] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Form field states
    const [eventTitle, setEventTitle] = useState('');
    const [payout, setPayout] = useState('');

    // Fetch all three types of events AND team members
    useEffect(() => {
        if (!property.id || !user.uid) return;

        // Fetch Manual Events
        const manualEventsQuery = query(collection(db, "events"), where("propertyId", "==", property.id));
        const unsubscribeManual = onSnapshot(manualEventsQuery, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'manual' }));
            setManualEvents(fetchedEvents.map(e => ({...e, start: e.start.toDate(), end: e.end.toDate()})));
        });

        // Fetch Synced Bookings
        const bookingsQuery = query(collection(db, "bookings"), where("propertyId", "==", property.id));
        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
            const fetchedBookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'booking' }));
            setSyncedBookings(fetchedBookings);
        });

        // Fetch Automated Tasks
        const tasksQuery = query(collection(db, "tasks"), where("propertyId", "==", property.id));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'task' }));
            setAutomatedTasks(fetchedTasks);
        });

        // Fetch Team Members (for TaskDetailModal)
        const teamQuery = query(collection(db, "users"), where("ownerId", "==", user.uid));
        const unsubscribeTeam = onSnapshot(teamQuery, (snapshot) => {
            setTeam(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });

        return () => {
            unsubscribeManual();
            unsubscribeBookings();
            unsubscribeTasks();
            unsubscribeTeam();
        };
    }, [property.id, user.uid]);

    // Format and combine all events for the calendar
    const allEvents = [
        ...manualEvents,
        ...syncedBookings.map(b => ({
            ...b,
            title: `Booking: ${b.guestName}`,
            start: new Date(b.startDate),
            end: new Date(b.endDate),
            allDay: true,
        })),
        ...automatedTasks.map(t => ({
            ...t,
            title: `Task: ${t.taskName}`,
            start: new Date(t.scheduledDate),
            end: new Date(t.scheduledDate),
            allDay: true,
        }))
    ];

    // --- UPDATED: Main logic for handling event clicks ---
    const handleSelectEvent = (event) => {
        switch (event.type) {
            case 'task':
                setSelectedTask(event);
                setIsTaskModalOpen(true);
                break;
            case 'booking':
                setSelectedBooking(event);
                setIsBookingModalOpen(true);
                break;
            case 'manual':
                setSelectedManualEvent(event);
                setEventTitle(event.title);
                setPayout(event.payout || '');
                setIsManualModalOpen(true);
                break;
            default:
                toast.info("This is a synced event and cannot be edited here.");
        }
    };

    // Handle creating a new manual event
    const handleSelectSlot = (slotInfo) => {
        setSelectedManualEvent({ start: slotInfo.start, end: slotInfo.end, allDay: !slotInfo.slots });
        setEventTitle('');
        setPayout('');
        setIsManualModalOpen(true);
    };

    // Save or Update a MANUAL event
    const handleSaveEvent = async () => {
        if (!eventTitle) return toast.error("Event title is required.");
        
        const eventData = {
            title: eventTitle,
            start: selectedManualEvent.start,
            end: selectedManualEvent.end,
            allDay: selectedManualEvent.allDay,
            propertyId: property.id,
            ownerId: user.uid,
            payout: Number(payout) || 0,
        };

        if (selectedManualEvent.id) {
            await updateDoc(doc(db, 'events', selectedManualEvent.id), eventData);
            toast.success("Event updated!");
        } else {
            await addDoc(collection(db, 'events'), eventData);
            toast.success("Event created!");
        }
        closeManualModal();
    };
    
    // Delete a MANUAL event
    const handleDeleteEvent = async () => {
        if (!selectedManualEvent?.id) return;
        if (window.confirm("Are you sure you want to delete this event?")) {
            await deleteDoc(doc(db, "events", selectedManualEvent.id));
            toast.success("Event deleted.");
            closeManualModal();
        }
    };

    const closeManualModal = () => {
        setIsManualModalOpen(false);
        setSelectedManualEvent(null);
        setEventTitle('');
        setPayout('');
    };

    // Function to style events based on their type
    const eventPropGetter = useCallback((event) => {
        const style = { borderRadius: '5px', border: 'none', color: 'white', display: 'block' };
        switch (event.type) {
            case 'booking': style.backgroundColor = '#6b21a8'; break; // Purple
            case 'task': style.backgroundColor = '#16a34a'; break; // Green
            default: style.backgroundColor = '#2563eb'; break; // Blue (manual)
        }
        return { style };
    }, []);
    
    return (
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative" style={{ height: '80vh' }}>
            <BigCalendar
                localizer={localizer}
                events={allEvents}
                startAccessor="start"
                endAccessor="end"
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventPropGetter}
                components={{ toolbar: CustomToolbar }}
            />

            {/* Render Modals based on state */}
            {isTaskModalOpen && (
                <TaskDetailModal
                    task={selectedTask}
                    team={team}
                    onClose={() => setIsTaskModalOpen(false)}
                />
            )}

            {isBookingModalOpen && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setIsBookingModalOpen(false)}
                />
            )}

            {isManualModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{selectedManualEvent?.id ? 'Edit Event' : 'New Booking / Event'}</h3>
                            <button onClick={closeManualModal}><X size={24} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"/></button>
                        </div>
                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title / Guest Name</label>
                                <input id="eventTitle" type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="mt-1 input-style" placeholder="e.g., John Doe" />
                            </div>
                            <div>
                                <label htmlFor="payout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Booking Payout ($)</label>
                                <input id="payout" type="number" value={payout} onChange={(e) => setPayout(e.target.value)} className="mt-1 input-style" placeholder="e.g., 450.50" />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter the total revenue from this booking. This is used for performance calculations.</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-6 mt-4 border-t dark:border-gray-700">
                            <div>
                                {selectedManualEvent?.id && (
                                    <button onClick={handleDeleteEvent} className="button-secondary-danger text-sm"><Trash size={14} className="mr-2"/>Delete</button>
                                )}
                            </div>
                           <div className="flex space-x-2">
                                <button onClick={closeManualModal} className="button-secondary">Cancel</button>
                                <button onClick={handleSaveEvent} className="button-primary">{selectedManualEvent?.id ? 'Update' : 'Create'}</button>
                           </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};