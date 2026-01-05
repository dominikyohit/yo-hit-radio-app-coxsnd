
import { Audio } from 'expo-av';

/**
 * Global Audio Manager - Singleton pattern
 * Ensures only one audio source plays at a time
 */
class AudioManager {
  private static instance: AudioManager;
  private sound: Audio.Sound | null = null;
  private isLiveStream: boolean = false;
  private currentUri: string = '';

  private constructor() {
    // Configure audio mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Play audio from URI (live stream or on-demand track)
   * Automatically stops any currently playing audio first
   */
  public async playAudio(uri: string, isLiveStream: boolean = false): Promise<void> {
    try {
      // Stop current audio if playing
      await this.stopCurrentAudio();

      // Load and play new audio
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        null
      );

      this.sound = sound;
      this.isLiveStream = isLiveStream;
      this.currentUri = uri;
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Stop and unload current audio
   */
  public async stopCurrentAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
      this.sound = null;
      this.isLiveStream = false;
      this.currentUri = '';
    }
  }

  /**
   * Pause current audio
   */
  public async pauseAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.pauseAsync();
      } catch (error) {
        console.error('Error pausing audio:', error);
      }
    }
  }

  /**
   * Resume paused audio
   */
  public async resumeAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.playAsync();
      } catch (error) {
        console.error('Error resuming audio:', error);
      }
    }
  }

  /**
   * Check if audio is currently playing
   */
  public async isPlaying(): Promise<boolean> {
    if (!this.sound) return false;
    try {
      const status = await this.sound.getStatusAsync();
      return status.isLoaded && status.isPlaying;
    } catch {
      return false;
    }
  }

  /**
   * Get current audio type
   */
  public getIsLiveStream(): boolean {
    return this.isLiveStream;
  }

  /**
   * Get current URI
   */
  public getCurrentUri(): string {
    return this.currentUri;
  }
}

export default AudioManager;
