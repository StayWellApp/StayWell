import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase-config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import ChatMessageInput from './ChatMessageInput';
import { User, Users } from 'lucide-react';

// MessageBubble component (no changes needed)
const MessageBubble = ({ msg, isOwnMessage, senderName }) => (
    <div className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className={`rounded-lg px-4 py-2 max-w-lg shadow-md ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
            {!isOwnMessage && <p className="text-xs font-bold text-blue-400 mb-1">{senderName}</p>}
            {msg.text && <p>{msg.text}</p>}
            {msg.imageUrl && <img src={msg.imageUrl} alt="chat content" className="mt-2 rounded-lg max-w-xs cursor-pointer" onClick={() => window.open(msg.imageUrl, '_blank')}/>}
             <p className="text-right text-xs mt-1 opacity-75">{msg.createdAt?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
        </div>
    </div>
);


const ChatMessageView = ({ chat, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [chatMembers, setChatMembers] = useState({});
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Fetch member details for names
        const memberDetails = {};
        chat.members.forEach(id => {
            const userDoc = doc(db, 'users', id);
            onSnapshot(userDoc, (snapshot) => {
                if(snapshot.exists()){
                    memberDetails[id] = snapshot.data().displayName || snapshot.data().email;
                    setChatMembers({...memberDetails});
                }
            });
        });
    }, [chat.members]);

    useEffect(() => {
        const q = query(collection(db, 'chats', chat.id, 'messages'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            
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

    useEffect(() => {
        const chatRef = doc(db, 'chats', chat.id);
        const unsubscribe = onSnapshot(chatRef, (doc) => {
            const typing = doc.data()?.typing || [];
            // Filter out the current user from the typing list
            setTypingUsers(typing.filter(name => name !== currentUser.displayName));
        });
        return unsubscribe;
    }, [chat.id, currentUser.displayName]);

    const getChatName = () => {
        if (chat.isGroup) {
            return chat.groupName || 'Group Chat';
        }
        const otherUserId = chat.members.find(uid => uid !== currentUser.uid);
        return chatMembers[otherUserId] || 'Loading...';
    };

    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                <div className="flex items-center">
                    {chat.isGroup ? <Users className="mr-3 text-gray-500"/> : <User className="mr-3 text-gray-500"/>}
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{getChatName()}</h3>
                </div>
            </header>
            <div className="flex-1 p-6 overflow-y-auto bg-gray-100 dark:bg-gray-900">
                {messages.map(msg => (
                    <MessageBubble key={msg.id} msg={msg} isOwnMessage={msg.senderId === currentUser.uid} senderName={chatMembers[msg.senderId]}/>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="px-6 pt-2 pb-1 text-sm text-gray-500 h-8">
                {typingUsers.length > 0 && `${typingUsers.join(', ')} is typing...`}
            </div>
            <ChatMessageInput chatId={chat.id} currentUser={currentUser} />
        </div>
    );
};

export default ChatMessageView;
