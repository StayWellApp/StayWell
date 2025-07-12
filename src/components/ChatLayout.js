import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import ChatSidebar from './ChatSidebar';
import ChatMessageView from './ChatMessageView';
import { usePresence } from '../hooks/usePresence';

const ChatLayout = ({ userData }) => {
    usePresence(); // Hook to manage user's online status

    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        // Query for all chats where the current user is a member, order by last message time
        const q = query(collection(db, 'chats'), where('members', 'array-contains', currentUser.uid), orderBy('lastMessage.createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setChats(chatData);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (!currentUser) return null;

    // This component now renders as a standard view, not a modal
    return (
        <div className="w-full h-full flex bg-white dark:bg-gray-900">
            <ChatSidebar 
                chats={chats} 
                currentUser={currentUser}
                userData={userData}
                activeChat={activeChat}
                setActiveChat={setActiveChat}
            />
            <div className="flex-grow flex flex-col">
                {activeChat ? (
                    <ChatMessageView 
                        chat={activeChat}
                        currentUser={currentUser}
                    />
                ) : (
                    <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">StayWell Chat</h2>
                            <p className="text-gray-500">Select a conversation or start a new one.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatLayout;
