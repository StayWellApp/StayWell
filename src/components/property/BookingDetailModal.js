// src/components/property/BookingDetailModal.js
import React from 'react';
import { db } from '../../firebase-config';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Trash2, Calendar, User, Home } from 'lucide-react';

export const BookingDetailModal = ({ booking, onClose }) => {
    if (!booking) return null;

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this synced booking? It will reappear on the next sync unless deleted from the source calendar.")) {
            const toastId = toast.loading("Deleting booking...");
            try {
                await deleteDoc(doc(db, "bookings", booking.id));
                toast.update(toastId, { render: "Booking deleted from StayWell.", type: "success", isLoading: false, autoClose: 3000 });
                onClose();
            } catch (error) {
                console.error("Error deleting booking:", error);
                toast.update(toastId, { render: "Failed to delete booking.", type: "error", isLoading: false, autoClose: 5000 });
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Booking Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-full">&times;</button>
                </div>

                <div className="space-y-4 text-sm">
                    <InfoItem icon={<User size={16}/>} label="Guest Name" value={booking.guestName} />
                    <InfoItem icon={<Home size={16}/>} label="Property" value={booking.propertyName} />
                    <InfoItem icon={<Calendar size={16}/>} label="Dates" value={`${booking.startDate} to ${booking.endDate}`} />
                </div>

                <div className="flex justify-end items-center mt-6 pt-4 border-t dark:border-gray-700">
                    <button onClick={handleDelete} className="button-secondary-danger flex items-center">
                        <Trash2 size={14} className="mr-2"/> Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="text-gray-400 mt-0.5">{icon}</div>
        <div className="ml-3">
            <p className="font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);