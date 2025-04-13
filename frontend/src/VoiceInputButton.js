import React from 'react';
import useVoiceInput from './voiceInput';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

const VoiceInputButton = ({ onTranscript }) => {
  const { isListening, transcript, error, startListening, stopListening } = useVoiceInput();

  React.useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="voice-input-container">
      <button
        className={`voice-input-button ${isListening ? 'listening' : ''}`}
        onClick={handleClick}
        title={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
      </button>
      {error && <div className="error-message">{error}</div>}
      <style jsx>{`
        .voice-input-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .voice-input-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        .voice-input-button:hover {
          background-color: #f0f0f0;
        }
        .voice-input-button.listening {
          background-color: #ff4444;
          color: white;
        }
        .error-message {
          color: red;
          font-size: 0.8rem;
          margin-top: 5px;
        }
      `}</style>
    </div>
  );
};

export default VoiceInputButton; 