import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import VoiceButton from './VoiceButton';

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
  width: 100%;
  max-width: 600px;
`;

const TextInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 8px;
  background: transparent;

  &::placeholder {
    color: #999;
  }
`;

const SendButton = styled.button`
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    background: #0056b3;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const VoiceStatus = styled.div<{ isListening: boolean }>`
  font-size: 14px;
  color: ${props => props.isListening ? '#ff4b4b' : '#666'};
  margin-left: 8px;
  opacity: ${props => props.isListening ? 1 : 0};
  transition: opacity 0.3s ease;
`;

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  isListening: boolean;
  audioLevel?: number;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStartVoice,
  onStopVoice,
  isListening,
  audioLevel = 0,
  placeholder = "Type a message or click the mic to speak...",
  disabled = false
}) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isListening && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isListening]);

  const handleSubmit = async () => {
    if (message.trim() || isListening) {
      setIsSending(true);
      await onSendMessage(message.trim());
      setMessage("");
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <InputContainer>
      <TextInput
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled || isListening}
      />
      
      <VoiceButton
        onStart={onStartVoice}
        onStop={onStopVoice}
        isListening={isListening}
        audioLevel={audioLevel}
      />
      
      <VoiceStatus isListening={isListening}>
        {isListening ? 'Listening...' : ''}
      </VoiceStatus>

      <SendButton
        onClick={handleSubmit}
        disabled={disabled || isSending || (!message.trim() && !isListening)}
      >
        ➤
      </SendButton>
    </InputContainer>
  );
};

export default ChatInput; 