import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import ChatInput from './ChatInput';
import { ShoppingAgent } from '../langchain_engine';

// Sound effects
const messageSound = new Audio('/sounds/message.mp3');
const deliveredSound = new Audio('/sounds/delivered.mp3');
const reactionSound = new Audio('/sounds/reaction.mp3');

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: #2C3E50;
  font-size: 24px;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #7F8C8D;
  font-size: 16px;
  margin: 8px 0 0 0;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Message = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin: 16px 0;
`;

const MessageContent = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${props => props.isUser ? '#007AFF' : '#F0F2F5'};
  color: ${props => props.isUser ? 'white' : '#1C1E21'};
  font-size: 16px;
  line-height: 1.4;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  
  &:hover .reaction-button {
    opacity: 1;
  }
`;

const ReactionButton = styled.button`
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  border: 1px solid #E4E4E4;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  &:hover {
    background: #F5F5F5;
  }
`;

const ReactionPopup = styled.div`
  position: absolute;
  right: -120px;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  border-radius: 20px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 8px;
  z-index: 100;
`;

const ReactionEmoji = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.2);
    background: #F0F2F5;
  }
`;

const Reactions = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
`;

const Reaction = styled.div`
  background: #F0F2F5;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const MessageFooter = styled.div<{ isUser: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: ${props => props.isUser ? 'rgba(255, 255, 255, 0.7)' : '#8E8E93'};
`;

const MessageTime = styled.span`
  font-size: 11px;
  margin: 0 4px;
`;

const MessageStatus = styled.div<{ 
  status: 'sent' | 'delivered' | 'read' | 'typing' | 'recording' | 'error' 
}>`
  display: flex;
  align-items: center;
  
  svg {
    width: 14px;
    height: 14px;
    fill: ${props => {
      switch (props.status) {
        case 'read':
          return '#34B7F1';
        case 'delivered':
          return '#92929D';
        case 'typing':
          return '#92929D';
        case 'recording':
          return '#FF4B4B';
        case 'error':
          return '#FF4B4B';
        default:
          return '#92929D';
      }
    }};
  }
`;

const Avatar = styled.div<{ isUser: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px;
  background: ${props => props.isUser ? '#007AFF' : '#F0F2F5'};
  color: ${props => props.isUser ? 'white' : '#1C1E21'};
  font-size: 16px;
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #F0F2F5;
  border-radius: 16px;
  width: fit-content;
  margin: 8px 0;
`;

const TypingDot = styled.div<{ animationDelay: string }>`
  width: 8px;
  height: 8px;
  background: #90A4AE;
  border-radius: 50%;
  animation: typing 1.4s infinite;
  animation-delay: ${props => props.animationDelay};

  @keyframes typing {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
`;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read' | 'typing' | 'recording' | 'error';
  reactions?: { emoji: string; count: number; users: string[] }[];
}

const StatusIcon = ({ status }: { 
  status: 'sent' | 'delivered' | 'read' | 'typing' | 'recording' | 'error' 
}) => {
  switch (status) {
    case 'sent':
      return (
        <svg viewBox="0 0 16 16">
          <path d="M4.5 10.5L7 13L12.5 5" strokeWidth="1.5" stroke="currentColor" fill="none"/>
        </svg>
      );
    case 'delivered':
      return (
        <svg viewBox="0 0 16 16">
          <path d="M2.5 8.5L5 11L7.5 8.5M7.5 8.5L10 11L15.5 3" strokeWidth="1.5" stroke="currentColor" fill="none"/>
        </svg>
      );
    case 'read':
      return (
        <svg viewBox="0 0 16 16">
          <path d="M2.5 8.5L5 11L7.5 8.5M7.5 8.5L10 11L15.5 3" strokeWidth="1.5" stroke="#34B7F1" fill="none"/>
        </svg>
      );
    case 'typing':
      return <span>typing...</span>;
    case 'recording':
      return <span>🎤 recording...</span>;
    case 'error':
      return <span>⚠️</span>;
    default:
      return null;
  }
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
  const isThisWeek = date > new Date(now.setDate(now.getDate() - 6));
  
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  };
  
  if (isToday) {
    return date.toLocaleTimeString([], timeOptions);
  } else if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], timeOptions)}`;
  } else if (isThisWeek) {
    return date.toLocaleDateString([], { 
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
};

const REACTION_EMOJIS = ['👍', '❤️', '😊', '🎉', '👏', '🥖'];

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shoppingAgent = useRef<ShoppingAgent>(new ShoppingAgent());

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: 'welcome',
      text: "Hi! I'm Bready, your shopping assistant. How can I help you today?",
      isUser: false,
      timestamp: Date.now()
    }]);

    // Preload sounds
    messageSound.load();
    deliveredSound.load();
    reactionSound.load();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const messageId = Date.now().toString();
    const userMessage: Message = {
      id: messageId,
      text,
      isUser: true,
      timestamp: Date.now()
    };

    messageSound.play();
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await shoppingAgent.current.process_message(text);

      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: response,
          isUser: false,
          timestamp: Date.now()
        }
      ]);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "I'm sorry, I encountered an error. Please try again.",
          isUser: false,
          timestamp: Date.now()
        }
      ]);
    }

    setIsTyping(false);
  };

  return (
    <Container>
      <Header>
        <Title>Chat with Bready</Title>
        <Subtitle>Your AI Shopping Assistant</Subtitle>
      </Header>

      <MessagesContainer>
        {messages.map((message) => (
          <Message key={message.id} isUser={message.isUser}>
            <Avatar isUser={message.isUser}>
              {message.isUser ? '👤' : '🥖'}
            </Avatar>
            <div>
              <MessageContent isUser={message.isUser}>
                {message.text}
                {!message.isUser && (
                  <ReactionButton
                    className="reaction-button"
                  >
                    😀
                  </ReactionButton>
                )}
              </MessageContent>
              
              {message.reactions && message.reactions.length > 0 && (
                <Reactions>
                  {message.reactions.map(reaction => (
                    <Reaction key={reaction.emoji}>
                      {reaction.emoji} {reaction.count}
                    </Reaction>
                  ))}
                </Reactions>
              )}
              
              <MessageFooter isUser={message.isUser}>
                <MessageTime>{formatTime(message.timestamp)}</MessageTime>
                {message.isUser && message.status && (
                  <MessageStatus status={message.status}>
                    <StatusIcon status={message.status} />
                  </MessageStatus>
                )}
              </MessageFooter>
            </div>
          </Message>
        ))}

        {isTyping && (
          <Message isUser={false}>
            <Avatar isUser={false}>🥖</Avatar>
            <TypingIndicator>
              <TypingDot animationDelay="0s" />
              <TypingDot animationDelay="0.2s" />
              <TypingDot animationDelay="0.4s" />
            </TypingIndicator>
          </Message>
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      <ChatInput onSendMessage={handleSendMessage} isTyping={isTyping} />
    </Container>
  );
};

export default Chat; 