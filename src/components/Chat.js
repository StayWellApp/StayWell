import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { X, Send } from 'lucide-react';

const Chat = ({ user, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const q = query(collection(db, "chatMessages"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        await addDoc(collection(db, 'chatMessages'), {
            text: newMessage,
            createdAt: serverTimestamp(),
            uid: user.uid,
            displayName: user.displayName || user.email,
        });
        setNewMessage('');
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-gray-800 shadow-lg rounded-lg flex flex-col border border-gray-200 dark:border-gray-700">
            <header className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Team Chat</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X size={20} />
                </button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex mb-2 ${msg.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-3 py-2 ${msg.uid === user.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                            <p className="text-sm font-semibold">{msg.displayName}</p>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700 flex items-center">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow input-style"
                />
                <button type="submit" className="ml-2 button-primary">
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};

export default Chat;