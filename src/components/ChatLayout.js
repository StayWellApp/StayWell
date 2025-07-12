import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ChatSidebar from './ChatSidebar';
import ChatMessageView from './ChatMessageView';
import { usePresence } from '../hooks/usePresence';

const ChatLayout = ({ onClose }) => {
    usePresence(); // Hook to manage user's online status

    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        // Query for all chats where the current user is a member
        const q = query(collection(db, 'chats'), where('members', 'array-contains', currentUser.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setChats(chatData);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (!currentUser) return null;

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex">
            <ChatSidebar 
                chats={chats} 
                currentUser={currentUser}
                activeChat={activeChat}
                setActiveChat={setActiveChat}
            />
            <div className="flex-grow flex flex-col">
                {activeChat ? (
                    <ChatMessageView 
                        chat={activeChat}
                        currentUser={currentUser} 
                        onClose={onClose}
                    />
                ) : (
                    <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Welcome to Chat</h2>
                            <p className="text-gray-500">Select a conversation to start messaging.</p>
                             <button onClick={onClose} className="mt-4 button-secondary">Close Chat</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatLayout;