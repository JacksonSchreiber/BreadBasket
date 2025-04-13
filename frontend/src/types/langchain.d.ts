declare module 'langchain_engine' {
  export class VoiceInteraction {
    constructor();
    speak(text: string): void;
    start_continuous_listening(): void;
    stop_continuous_listening(): void;
    process_audio_chunk(audio_data: Float32Array | null): number;
    set_callback(callback: (text: string) => void): void;
    update_voice_settings(settings: Record<string, any>): void;
  }

  export class ShoppingAgent {
    constructor(openai_api_key?: string, db_file?: string);
    voice: VoiceInteraction;
    process_message(message: string, user_id?: string): Promise<string>;
    start_voice_interaction(): void;
    stop_voice_interaction(): void;
    set_audio_level_callback(callback: (level: number) => void): void;
    update_voice_settings(settings: Record<string, any>): void;
  }
} 