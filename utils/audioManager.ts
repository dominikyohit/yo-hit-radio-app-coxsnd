
import { Audio } from 'expo-av';

class AudioManager {
  private static instance: AudioManager;
  private currentSound: Audio.Sound | null = null;
  private isLiveStream: boolean = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async stopCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
      this.currentSound = null;
      this.isLiveStream = false;
    }
  }

  async playAudio(sound: Audio.Sound, isLiveStream: boolean = false): Promise<void> {
    await this.stopCurrentAudio();
    this.currentSound = sound;
    this.isLiveStream = isLiveStream;
    await sound.playAsync();
  }

  getCurrentSound(): Audio.Sound | null {
    return this.currentSound;
  }

  getIsLiveStream(): boolean {
    return this.isLiveStream;
  }
}

export default AudioManager.getInstance();
