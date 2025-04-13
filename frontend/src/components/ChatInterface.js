import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatInterface.css';

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        {
            role: "system",
            content: "You are Bready, a friendly and helpful grocery shopping assistant. How can I help you today? 😊"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setIsLoading(true);

        // Add user message to chat
        const updatedMessages = [
            ...messages,
            { role: "user", content: userMessage }
        ];
        setMessages(updatedMessages);

        try {
            // Send message to backend
            const response = await axios.post('http://localhost:5000/chat', {
                message: userMessage,
                history: updatedMessages
            });

            if (response.data.status === "success") {
                // Add assistant's response to chat
                setMessages(prev => [
                    ...prev,
                    { role: "assistant", content: response.data.response }
                ]);
            } else {
                throw new Error(response.data.error || "Unknown error occurred");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [
                ...prev,
                { 
                    role: "assistant", 
                    content: "I'm sorry, I encountered an error. Please try again." 
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-interface">
            <div className="messages-container">
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        className={`message ${message.role === "user" ? "user-message" : "assistant-message"}`}
                    >
                        <div className="message-content">
                            {message.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={sendMessage} className="input-container">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send"}
                </button>
            </form>
        </div>
    );
};

export default ChatInterface; 