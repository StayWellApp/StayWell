import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle } from 'lucide-react';

const ChatSidebar = ({ chats, currentUser, userData, activeChat, setActiveChat }) => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [users, setUsers] = useState([]); // Stores user data for existing chat names
    const [isCreatingChat, setIsCreatingChat] = useState(false);

    // Effect 1: Fetch team members based on the current user's team (ownerId)
    useEffect(() => {
        if (!currentUser || !userData) return;

        // The ownerId links all members of a team together.
        const ownerId = userData.ownerId || currentUser.uid; 
        const q = query(collection(db, 'users'), where('ownerId', '==', ownerId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeamMembers(members);
        });

        return () => unsubscribe();
    }, [currentUser, userData]);

    // Effect 2: Fetch user data for existing chats to display names correctly
    useEffect(() => {
        if (chats.length === 0) return;

        const allMemberIds = chats.flatMap(chat => chat.members);
        const uniqueMemberIds = [...new Set(allMemberIds)];

        if (uniqueMemberIds.length > 0) {
            const q = query(collection(db, 'users'), where('__name__', 'in', uniqueMemberIds));
            getDocs(q).then(snapshot => {
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(usersData);
            });
        }
    }, [chats]);

    // Helper to get the display name for a chat
    const getChatName = (chat) => {
        if (chat.isGroup) {
            return chat.groupName || 'Group Chat';
        }
        const otherUserId = chat.members.find(uid => uid !== currentUser.uid);
        const otherUser = users.find(u => u.id === otherUserId) || teamMembers.find(u => u.id === otherUserId);
        return otherUser ? otherUser.displayName || otherUser.email : 'User';
    };
    
    // Function to start a new 1-on-1 chat with a team member
    const handleCreateChat = async (member) => {
        // Check if a 1-on-1 chat with this member already exists
        const existingChat = chats.find(chat => 
            !chat.isGroup && chat.members.length === 2 && chat.members.includes(member.id)
        );

        if (existingChat) {
            setActiveChat(existingChat);
        } else {
            // Create a new chat document in Firestore
            await addDoc(collection(db, 'chats'), {
                members: [currentUser.uid, member.id],
                isGroup: false,
                createdAt: serverTimestamp(),
                lastMessage: null,
                typing: []
            });
        }
        setIsCreatingChat(false);
    };

    return (
        <aside className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
            <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Conversations</h2>
                <button onClick={() => setIsCreatingChat(!isCreatingChat)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Start new chat">
                    <PlusCircle size={22} />
                </button>
            </header>
            <div className="flex-grow overflow-y-auto">
                {isCreatingChat ? (
                     <div>
                        <h3 className="p-4 text-sm font-semibold text-gray-500">Start a new chat with:</h3>
                        <ul>
                            {teamMembers.filter(m => m.id !== currentUser.uid).map(member => (
                                <li key={member.id}>
                                    <button onClick={() => handleCreateChat(member)} className="w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{member.displayName || member.email}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <ul>
                        {chats.map(chat => (
                            <li key={chat.id}>
                                <button 
                                    onClick={() => setActiveChat(chat)}
                                    className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700 ${activeChat?.id === chat.id ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                                >
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{getChatName(chat)}</p>
                                    <p className="text-sm text-gray-500 truncate">{chat.lastMessage?.text || 'No messages yet'}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
};

export default ChatSidebar;
