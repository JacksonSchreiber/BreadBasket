import OpenAI from 'openai';

export class ShoppingAgent {
  private openai: OpenAI;
  private voice: any; // TODO: Implement voice interface
  private cache: Map<string, { response: string; timestamp: number }>;
  private lastRequestTime: number;
  private requestCount: number;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    });
    this.cache = new Map();
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.voice = {
      speak: (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    };
  }

  async process_message(text: string): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error processing message:', error);
      return "I'm sorry, I encountered an error. Please try again.";
    }
  }

  private shouldThrottle(): boolean {
    const now = Date.now();
    const oneMinute = 60000;
    
    if (now - this.lastRequestTime >= oneMinute) {
      this.requestCount = 0;
      this.lastRequestTime = now;
      return false;
    }

    return this.requestCount >= 60; // Max 60 requests per minute
  }

  private updateRateLimit(): void {
    const now = Date.now();
    if (now - this.lastRequestTime >= 60000) {
      this.requestCount = 1;
      this.lastRequestTime = now;
    } else {
      this.requestCount++;
    }
  }

  start_voice_interaction(): void {
    // TODO: Implement voice recognition
    console.log('Voice interaction started');
  }

  stop_voice_interaction(): void {
    // TODO: Implement voice recognition stop
    console.log('Voice interaction stopped');
  }
} 