import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import VoiceButton from './VoiceButton';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Conversation = styled.div`
  width: 100%;
  max-width: 600px;
  height: 400px;
  overflow-y: auto;
  margin: 20px 0;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
`;

const Message = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin: 10px 0;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => props.isUser ? '#007AFF' : '#E9ECEF'};
  color: ${props => props.isUser ? 'white' : 'black'};
  font-size: 16px;
  line-height: 1.4;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Settings = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const SettingButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: ${props => props.active ? '#007AFF' : '#E9ECEF'};
  color: ${props => props.active ? 'white' : 'black'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

interface Message {
  text: string;
  isUser: boolean;
  timestamp: number;
}

interface VoiceChatProps {
  onStart: () => void;
  onStop: () => void;
  onSettingsChange: (settings: any) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ onStart, onStop, onSettingsChange }) => {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const conversationRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState({
    autoListen: true,
    noiseReduction: true,
    sentenceCompletion: true,
  });

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = () => {
    setIsListening(true);
    onStart();
  };

  const handleStop = () => {
    setIsListening(false);
    onStop();
  };

  const handleAudioLevel = (level: number) => {
    setAudioLevel(level);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [...prev, {
      text,
      isUser,
      timestamp: Date.now(),
    }]);
  };

  return (
    <Container>
      <Conversation ref={conversationRef}>
        {messages.map((message, index) => (
          <Message key={index} isUser={message.isUser}>
            <MessageBubble isUser={message.isUser}>
              {message.text}
            </MessageBubble>
          </Message>
        ))}
      </Conversation>

      <Controls>
        <VoiceButton
          onStart={handleStart}
          onStop={handleStop}
          isListening={isListening}
          audioLevel={audioLevel}
        />
      </Controls>

      <Settings>
        <SettingButton
          active={settings.autoListen}
          onClick={() => toggleSetting('autoListen')}
        >
          Auto Listen
        </SettingButton>
        <SettingButton
          active={settings.noiseReduction}
          onClick={() => toggleSetting('noiseReduction')}
        >
          Noise Reduction
        </SettingButton>
        <SettingButton
          active={settings.sentenceCompletion}
          onClick={() => toggleSetting('sentenceCompletion')}
        >
          Sentence Detection
        </SettingButton>
      </Settings>
    </Container>
  );
};

export default VoiceChat; 