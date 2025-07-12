import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, getDocs } from 'firebase/firestore';

// This is a simplified version. A full implementation would need user search and group creation modals.
const ChatSidebar = ({ chats, currentUser, activeChat, setActiveChat }) => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchUsers();
    }, []);
    
    const getChatName = (chat) => {
        if (chat.isGroup) {
            return chat.groupName;
        }
        // For 1-on-1 chats, find the other user's name
        const otherUserId = chat.members.find(uid => uid !== currentUser.uid);
        const otherUser = users.find(u => u.id === otherUserId);
        return otherUser ? otherUser.displayName || otherUser.email : 'User';
    };

    return (
        <aside className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
            <header className="p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Conversations</h2>
                {/* Add buttons for new chat/group here */}
            </header>
            <div className="flex-grow overflow-y-auto">
                <ul>
                    {chats.map(chat => (
                        <li key={chat.id}>
                            <button 
                                onClick={() => setActiveChat(chat)}
                                className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700 ${activeChat?.id === chat.id ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                            >
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{getChatName(chat)}</p>
                                <p className="text-sm text-gray-500 truncate">{chat.lastMessage?.text}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
};

export default ChatSidebar;