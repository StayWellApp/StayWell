import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase-config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import ChatMessageInput from './ChatMessageInput';
import { X, User, Users } from 'lucide-react';

// Simplified message bubble
const MessageBubble = ({ msg, isOwnMessage }) => (
    <div className={`flex mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className={`rounded-lg px-3 py-2 max-w-lg ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
            <p className="text-sm font-semibold">{msg.senderName || 'User'}</p>
            {msg.text && <p>{msg.text}</p>}
            {msg.imageUrl && <img src={msg.imageUrl} alt="chat content" className="mt-2 rounded-lg max-w-xs"/>}
        </div>
    </div>
);

const ChatMessageView = ({ chat, currentUser, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const messagesEndRef = useRef(null);

    // Effect for scrolling and fetching messages
    useEffect(() => {
        const q = query(collection(db, 'chats', chat.id, 'messages'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            // Mark messages as read
            msgs.forEach(msg => {
                if (msg.senderId !== currentUser.uid && !msg.readBy?.includes(currentUser.uid)) {
                    const msgRef = doc(db, 'chats', chat.id, 'messages', msg.id);
                    updateDoc(msgRef, { readBy: arrayUnion(currentUser.uid) });
                }
            });
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
        return unsubscribe;
    }, [chat.id, currentUser.uid]);

    // Effect for typing indicators
    useEffect(() => {
        const chatRef = doc(db, 'chats', chat.id);
        const unsubscribe = onSnapshot(chatRef, (doc) => {
            setTypingUsers(doc.data()?.typing || []);
        });
        return unsubscribe;
    }, [chat.id]);

    return (
        <div className="flex-grow flex flex-col h-screen">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center">
                    {chat.isGroup ? <Users className="mr-3"/> : <User className="mr-3"/>}
                    <h3 className="font-semibold text-lg">{chat.groupName || 'Conversation'}</h3>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={20} />
                </button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                {messages.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} isOwnMessage={msg.senderId === currentUser.uid} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-2 text-sm text-gray-500 h-6">
                {typingUsers.length > 0 && `${typingUsers.join(', ')} is typing...`}
            </div>
            <ChatMessageInput chatId={chat.id} currentUser={currentUser} />
        </div>
    );
};

export default ChatMessageView;