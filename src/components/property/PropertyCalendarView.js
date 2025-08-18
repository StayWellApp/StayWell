// src/components/property/PropertyCalendarView.js
// MERGED FILE: Displays manual events, synced iCal bookings, and automated tasks.

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase-config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';
import { Trash, X } from 'lucide-react';

const localizer = momentLocalizer(moment);

// Custom Toolbar for the Calendar (no changes needed)
const CustomToolbar = (toolbar) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToCurrent = () => toolbar.onNavigate('TODAY');
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
    const [manualEvents, setManualEvents] = useState([]);
    const [syncedBookings, setSyncedBookings] = useState([]);
    const [automatedTasks, setAutomatedTasks] = useState([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventTitle, setEventTitle] = useState('');
    const [payout, setPayout] = useState('');

    // --- MODIFIED: Fetch all three types of events ---
    useEffect(() => {
        if (!property.id) return;

        // 1. Fetch Manual Events
        const manualEventsQuery = query(collection(db, "events"), where("propertyId", "==", property.id));
        const unsubscribeManual = onSnapshot(manualEventsQuery, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    start: data.start.toDate(),
                    end: data.end.toDate(),
                    payout: data.payout || 0,
                    allDay: data.allDay,
                    type: 'manual' // Identify event type
                };
            });
            setManualEvents(fetchedEvents);
        });

        // 2. Fetch Synced Bookings from iCal
        const bookingsQuery = query(collection(db, "bookings"), where("propertyId", "==", property.id));
        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
            const fetchedBookings = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: `Booking: ${data.guestName}`,
                    start: new Date(data.startDate),
                    end: new Date(data.endDate),
                    allDay: true,
                    type: 'booking' // Identify event type
                };
            });
            setSyncedBookings(fetchedBookings);
        });

        // 3. Fetch Automated Tasks
        const tasksQuery = query(collection(db, "tasks"), where("propertyId", "==", property.id));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: `Task: ${data.taskName}`,
                    start: new Date(data.scheduledDate),
                    end: new Date(data.scheduledDate),
                    allDay: true,
                    type: 'task' // Identify event type
                };
            });
            setAutomatedTasks(fetchedTasks);
        });

        return () => {
            unsubscribeManual();
            unsubscribeBookings();
            unsubscribeTasks();
        };
    }, [property.id]);

    // Combine all events into one array for the calendar
    const allEvents = [...manualEvents, ...syncedBookings, ...automatedTasks];

    // Handle selecting a calendar slot to create a new MANUAL event
    const handleSelectSlot = (slotInfo) => {
        setSelectedEvent(null);
        setEventTitle('');
        setPayout('');
        setIsModalOpen(true);
        setSelectedEvent({
            start: slotInfo.start,
            end: slotInfo.end,
            allDay: !slotInfo.slots,
        });
    };

    // --- MODIFIED: Handle selecting an existing event ---
    const handleSelectEvent = (event) => {
        if (event.type === 'manual') {
            // If it's a manual event, open the edit modal
            setSelectedEvent(event);
            setEventTitle(event.title);
            setPayout(event.payout || '');
            setIsModalOpen(true);
        } else {
            // For synced bookings and tasks, just show an alert with info
            const typeLabel = event.type.charAt(0).toUpperCase() + event.type.slice(1);
            toast.info(`${typeLabel}: ${event.title.split(': ')[1]}`, { autoClose: 5000 });
        }
    };

    // Save or Update a MANUAL event
    const handleSaveEvent = async () => {
        if (!eventTitle) {
            toast.error("Event title is required.");
            return;
        }
        const eventData = {
            title: eventTitle,
            start: selectedEvent.start,
            end: selectedEvent.end,
            allDay: selectedEvent.allDay,
            propertyId: property.id,
            ownerId: user.uid,
            payout: Number(payout) || 0,
        };
        const toastId = toast.loading(selectedEvent.id ? "Updating event..." : "Creating event...");
        try {
            if (selectedEvent.id) {
                const eventRef = doc(db, 'events', selectedEvent.id);
                await updateDoc(eventRef, eventData);
                toast.update(toastId, { render: "Event updated!", type: "success", isLoading: false, autoClose: 2000 });
            } else {
                await addDoc(collection(db, 'events'), eventData);
                toast.update(toastId, { render: "Event created!", type: "success", isLoading: false, autoClose: 2000 });
            }
            closeModal();
        } catch (error) {
            console.error("Error saving event:", error);
            toast.update(toastId, { render: "Failed to save event.", type: "error", isLoading: false, autoClose: 4000 });
        }
    };
    
    // Delete a MANUAL event
    const handleDeleteEvent = async () => {
        if (!selectedEvent?.id) return;
        if (window.confirm("Are you sure you want to delete this event?")) {
            const toastId = toast.loading("Deleting event...");
            try {
                await deleteDoc(doc(db, "events", selectedEvent.id));
                toast.update(toastId, { render: "Event deleted.", type: "success", isLoading: false, autoClose: 2000 });
                closeModal();
            } catch (error) {
                console.error("Error deleting event:", error);
                toast.update(toastId, { render: "Failed to delete event.", type: "error", isLoading: false, autoClose: 4000 });
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
        setEventTitle('');
        setPayout('');
    };

    // --- NEW: Function to style events based on their type ---
    const eventPropGetter = useCallback((event) => {
        const style = {
            borderRadius: '5px',
            border: 'none',
            color: 'white',
            display: 'block',
        };
        switch (event.type) {
            case 'booking':
                style.backgroundColor = '#6b21a8'; // Purple
                break;
            case 'task':
                style.backgroundColor = '#16a34a'; // Green
                break;
            default: // manual
                style.backgroundColor = '#2563eb'; // Blue
                break;
        }
        return { style };
    }, []);
    
    return (
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative" style={{ height: '80vh' }}>
            <BigCalendar
                localizer={localizer}
                events={allEvents} // Use the combined array
                startAccessor="start"
                endAccessor="end"
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventPropGetter} // Apply custom styles
                components={{
                    toolbar: CustomToolbar
                }}
            />

            {/* Event Modal (only for manual events) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{selectedEvent?.id ? 'Edit Event' : 'New Booking / Event'}</h3>
                            <button onClick={closeModal}><X size={24} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"/></button>
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
                                {selectedEvent?.id && (
                                    <button onClick={handleDeleteEvent} className="button-secondary-danger text-sm"><Trash size={14} className="mr-2"/>Delete</button>
                                )}
                            </div>
                           <div className="flex space-x-2">
                                <button onClick={closeModal} className="button-secondary">Cancel</button>
                                <button onClick={handleSaveEvent} className="button-primary">{selectedEvent?.id ? 'Update' : 'Create'}</button>
                           </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};