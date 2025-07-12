import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../firebase-config';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Send, Image } from 'lucide-react';
import { useDebounce } from 'use-debounce';

const ChatMessageInput = ({ chatId, currentUser }) => {
    const [text, setText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [debouncedIsTyping] = useDebounce(isTyping, 1000);

    // Memoize the handleTyping function to stabilize it
    const handleTyping = useCallback(async (typing) => {
        const chatRef = doc(db, 'chats', chatId);
        const update = {
            typing: typing 
                ? arrayUnion(currentUser.displayName) 
                : arrayRemove(currentUser.displayName)
        };
        await updateDoc(chatRef, update);
    }, [chatId, currentUser.displayName]);
    
    // This useEffect now correctly includes its dependency
    useEffect(() => {
        handleTyping(debouncedIsTyping);
    }, [debouncedIsTyping, handleTyping]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (text.trim() === '') return;
        
        const chatRef = doc(db, 'chats', chatId);
        const messageData = {
            text: text,
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
            createdAt: serverTimestamp(),
            readBy: [currentUser.uid],
        };

        await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
        await updateDoc(chatRef, { lastMessage: messageData });
        setText('');
        setIsTyping(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const chatRef = doc(db, 'chats', chatId);
        const storageRef = ref(storage, `chat_images/${chatId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);

        const messageData = {
            imageUrl,
            senderId: currentUser.uid,
            senderName: currentUser.displayName,
            createdAt: serverTimestamp(),
            readBy: [currentUser.uid],
        };

        await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
        await updateDoc(chatRef, { lastMessage: { text: 'Image' , ...messageData } });
    };

    return (
        <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700 flex items-center bg-white dark:bg-gray-800">
            <label htmlFor="file-upload" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                <Image size={20} />
            </label>
            <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            
            <input
                type="text"
                value={text}
                onChange={(e) => { setText(e.target.value); setIsTyping(true); }}
                onBlur={() => setIsTyping(false)}
                placeholder="Type a message..."
                className="flex-grow input-style mx-2"
            />
            <button type="submit" className="button-primary">
                <Send size={16} />
            </button>
        </form>
    );
};

export default ChatMessageInput;
