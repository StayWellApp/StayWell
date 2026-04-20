import React, { useState, useEffect, Fragment } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, doc, writeBatch, orderBy } from 'firebase/firestore';
import { Menu, Transition } from '@headlessui/react';
import { Bell, Check, Trash, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        // Query 1: Notifications where userId matches current user
        const q1 = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid)
        );

        // Query 2: Notifications where ownerId matches current user
        const q2 = query(
            collection(db, 'notifications'),
            where('ownerId', '==', user.uid)
        );

        let notifs1 = [];
        let notifs2 = [];

        const updateNotifications = () => {
            const all = [...notifs1, ...notifs2];
            // Deduplicate by ID
            const unique = Array.from(new Map(all.map(item => [item.id, item])).values());

            // Sort by createdAt desc locally since we merge results
            unique.sort((a, b) => {
                const dateA = a.createdAt?.toDate() || new Date(0);
                const dateB = b.createdAt?.toDate() || new Date(0);
                return dateB - dateA;
            });

            setNotifications(unique);
            setUnreadCount(unique.filter(n => !n.isRead).length);
        };

        const unsubscribe1 = onSnapshot(q1, (snapshot) => {
            notifs1 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateNotifications();
        }, (error) => {
            console.error("Error fetching notifications (userId):", error);
        });

        const unsubscribe2 = onSnapshot(q2, (snapshot) => {
            notifs2 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            updateNotifications();
        }, (error) => {
            console.error("Error fetching notifications (ownerId):", error);
        });

        return () => {
            unsubscribe1();
            unsubscribe2();
        };
    }, [user]);

    const markAsRead = async (id) => {
        try {
            const notifRef = doc(db, 'notifications', id);
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await notifRef.update({ isRead: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            // Revert on error would be ideal, but for simplicity we skip it here as Firestore usually succeeds or fails loudly
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        if (unread.length === 0) return;

        try {
            // Firestore batch limit is 500
            const batch = writeBatch(db);
            unread.slice(0, 500).forEach(n => {
                const ref = doc(db, 'notifications', n.id);
                batch.update(ref, { isRead: true });
            });

            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = async (id) => {
        try {
             // Optimistic update
             setNotifications(prev => prev.filter(n => n.id !== id));
             const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
             if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));

             await db.collection('notifications').doc(id).delete();
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    }

    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors focus:outline-none">
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-[80vh] flex flex-col">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-grow">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                No notifications
                            </div>
                        ) : (
                            <div className="py-1">
                                {notifications.map((notification) => (
                                    <Menu.Item key={notification.id}>
                                        {({ active }) => (
                                            <div
                                                className={`${
                                                    active ? 'bg-gray-50 dark:bg-gray-700' : ''
                                                } ${
                                                    !notification.isRead ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                                                } px-4 py-3 flex items-start space-x-3 transition-colors duration-150`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${!notification.isRead ? 'font-semibold' : ''}`}>
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 flex space-x-1">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); markAsRead(notification.id); }}
                                                            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                     {/* Optional: Delete button
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); deleteNotification(notification.id); }}
                                                         className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        title="Delete"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                    */}
                                                </div>
                                            </div>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        )}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
};

export default NotificationCenter;
