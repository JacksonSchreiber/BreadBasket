import React, { useState, useRef, useEffect } from 'react';
import './BreadyChat.css';
import { ShoppingAgent } from '../langchain_engine';
import ShoppingCart from './ShoppingCart';

function BreadyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [zipCode, setZipCode] = useState(localStorage.getItem('user_zip_code') || '');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const shoppingAgent = useRef(new ShoppingAgent());

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('bready_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Initialize with welcome message
      setMessages([{
        text: "Hi! I'm Bready, your smart shopping assistant! 🤖 First, could you please share your ZIP code so I can show you available items in your area? 📍",
        sender: 'bot'
      }]);
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('bready_messages', JSON.stringify(messages));
  }, [messages]);

  // Save ZIP code to localStorage
  useEffect(() => {
    if (zipCode) {
        localStorage.setItem('user_zip_code', zipCode);
    }
  }, [zipCode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);
    
    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);

    try {
      // Process message through ShoppingAgent
      const response = await shoppingAgent.current.process_message(userMessage);
      
      // Add bot response to chat
      setMessages(prev => [...prev, { text: response, sender: 'bot' }]);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, {
        text: "I'm sorry, I encountered an error. Please try again.", 
        sender: 'bot',
        className: 'error'
      }]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
        }
  };

  return (
    <div className="bready-chat-container">
      {!isOpen && (
        <button 
          className="chat-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat with Bready"
        >
          <span className="bready-emoji">🤖</span>
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <span className="bready-emoji">🤖</span>
              <span>Chat with Bready</span>
            </div>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          
          <div className="messages-container">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.sender} ${message.className || ''}`}
              >
                {message.sender === 'bot' && <span className="bready-emoji">🤖</span>}
                <div className="message-content">
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <span className="bready-emoji">🤖</span>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="message-input"
            />
            <button type="submit" className="send-button">
              Send
            </button>
          </form>
        </div>
      )}

      <ShoppingCart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
}

export default BreadyChat;