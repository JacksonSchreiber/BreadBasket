import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const WaveContainer = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 50%;
  background: ${props => props.isListening ? '#ff4b4b' : '#4CAF50'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const WaveCircle = styled.div<{ isListening: boolean; delay: number }>`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${props => props.isListening ? 'rgba(255, 75, 75, 0.2)' : 'rgba(76, 175, 80, 0.2)'};
  animation: ${props => props.isListening ? 'wave 2s infinite' : 'none'};
  animation-delay: ${props => props.delay}s;
  
  @keyframes wave {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.8);
      opacity: 0;
    }
  }
`;

const WaveBar = styled.div<{ height: number; isListening: boolean }>`
  width: 4px;
  height: ${props => props.height}px;
  background: white;
  margin: 0 2px;
  border-radius: 2px;
  transition: height 0.1s ease;
  animation: ${props => props.isListening ? 'pulse 0.5s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% {
      transform: scaleY(1);
    }
    50% {
      transform: scaleY(0.7);
    }
  }
`;

const WaveVisualization = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  gap: 2px;
`;

const MicIcon = styled.div`
  color: white;
  font-size: 24px;
  z-index: 1;
`;

interface VoiceButtonProps {
  onStart: () => void;
  onStop: () => void;
  isListening: boolean;
  audioLevel?: number;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ onStart, onStop, isListening, audioLevel = 0 }) => {
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(5).fill(20));
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (isListening) {
      const updateWaveHeights = () => {
        setWaveHeights(prev => 
          prev.map(() => Math.max(15, Math.min(40, 20 + (audioLevel * 20)))
        ));
        animationFrameRef.current = requestAnimationFrame(updateWaveHeights);
      };
      
      animationFrameRef.current = requestAnimationFrame(updateWaveHeights);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setWaveHeights(Array(5).fill(20));
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, audioLevel]);

  const handleClick = () => {
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <WaveContainer onClick={handleClick} isListening={isListening}>
      <WaveCircle isListening={isListening} delay={0} />
      <WaveCircle isListening={isListening} delay={0.4} />
      <WaveCircle isListening={isListening} delay={0.8} />
      
      <WaveVisualization>
        {waveHeights.map((height, index) => (
          <WaveBar 
            key={index} 
            height={height} 
            isListening={isListening}
            style={{ 
              animationDelay: `${index * 0.1}s`
            }} 
          />
        ))}
      </WaveVisualization>
      
      <MicIcon>
        {isListening ? '⏹' : '🎤'}
      </MicIcon>
    </WaveContainer>
  );
};

export default VoiceButton; 