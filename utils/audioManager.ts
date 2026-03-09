
/**
 * Audio Manager - expo-av wrapper
 * 
 * Provides audio playback using expo-av (works in Expo Go preview)
 * Note: Background playback on Android requires additional configuration
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

class AudioManager {
  private static instance: AudioManager;
  private sound: Audio.Sound | null = null;
  private isSetup: boolean = false;
  private currentUri: string = '';
  private _isPlaying: boolean = false;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Setup audio session for playback
   */
  public async setupPlayer(): Promise<void> {
    if (this.isSetup) {
      console.log('[AudioManager] ✅ Player already setup');
      return;
    }

    try {
      console.log('[AudioManager] 🎵 Setting up audio session');
      console.log('[AudioManager] 📱 Platform:', Platform.OS);

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      this.isSetup = true;

      console.log('[AudioManager] ✅ Audio session setup complete');
      console.log('[AudioManager] ✅ Audio playback ENABLED');
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting up audio:', error);
      throw error;
    }
  }

  /**
   * Play audio from URI
   */
  public async playAudio(
    uri: string,
    isLiveStream: boolean = false,
    title: string = 'Yo Hit Radio',
    artist: string = 'Live Stream',
    artwork?: string
  ): Promise<void> {
    try {
      console.log('[AudioManager] 🎵 Starting playback');
      console.log('[AudioManager] 📻 Stream:', uri);
      console.log('[AudioManager] 🎤 Title:', title);
      console.log('[AudioManager] 👤 Artist:', artist);

      // Ensure audio session is setup
      if (!this.isSetup) {
        await this.setupPlayer();
      }

      // Unload previous sound if exists
      if (this.sound) {
        console.log('[AudioManager] 🔄 Unloading previous sound');
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Create and load new sound
      console.log('[AudioManager] 📥 Loading audio from URI');
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: false },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.currentUri = uri;
      this._isPlaying = true;

      console.log('[AudioManager] ✅ Playback started successfully');
      console.log('[AudioManager] ✅ Audio playback ACTIVE');
    } catch (error) {
      console.error('[AudioManager] ❌ Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Pause current audio
   */
  public async pauseAudio(): Promise<void> {
    if (!this.sound) {
      console.warn('[AudioManager] ⚠️ No sound loaded. Cannot pause.');
      return;
    }

    try {
      console.log('[AudioManager] ⏸️ Pausing audio');
      await this.sound.pauseAsync();
      this._isPlaying = false;
      console.log('[AudioManager] ✅ Audio paused');
    } catch (error) {
      console.error('[AudioManager] ❌ Error pausing audio:', error);
    }
  }

  /**
   * Resume paused audio
   */
  public async resumeAudio(): Promise<void> {
    if (!this.sound) {
      console.warn('[AudioManager] ⚠️ No sound loaded. Cannot resume.');
      return;
    }

    try {
      console.log('[AudioManager] ▶️ Resuming audio');
      await this.sound.playAsync();
      this._isPlaying = true;
      console.log('[AudioManager] ✅ Audio resumed');
    } catch (error) {
      console.error('[AudioManager] ❌ Error resuming audio:', error);
    }
  }

  /**
   * Stop and clear current audio
   */
  public async stopCurrentAudio(): Promise<void> {
    if (!this.sound) {
      console.warn('[AudioManager] ⚠️ No sound loaded. Nothing to stop.');
      return;
    }

    try {
      console.log('[AudioManager] 🛑 Stopping current audio');
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.currentUri = '';
      this._isPlaying = false;
      console.log('[AudioManager] ✅ Audio stopped');
    } catch (error) {
      console.error('[AudioManager] ❌ Error stopping audio:', error);
    }
  }

  /**
   * Check if audio is currently playing
   */
  public async isPlaying(): Promise<boolean> {
    if (!this.sound) {
      return false;
    }

    try {
      const status = await this.sound.getStatusAsync();
      return status.isLoaded && status.isPlaying;
    } catch {
      return false;
    }
  }

  /**
   * Get current URI
   */
  public getCurrentUri(): string {
    return this.currentUri;
  }

  /**
   * Update metadata for currently playing audio
   * Note: expo-av doesn't support updating metadata for media controls
   */
  public async updateMetadata(title: string, artist: string, artwork?: string): Promise<void> {
    console.log('[AudioManager] 📝 Metadata update requested:', { title, artist });
    console.log('[AudioManager] ℹ️ expo-av does not support updating media controls metadata');
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  public async setVolume(volume: number): Promise<void> {
    if (!this.sound) {
      console.warn('[AudioManager] ⚠️ No sound loaded. Cannot set volume.');
      return;
    }

    try {
      await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting volume:', error);
    }
  }

  /**
   * Playback status update callback
   */
  private onPlaybackStatusUpdate(status: any): void {
    if (status.isLoaded) {
      this._isPlaying = status.isPlaying;
      
      if (status.didJustFinish) {
        console.log('[AudioManager] 🏁 Playback finished');
        this._isPlaying = false;
      }
      
      if (status.error) {
        console.error('[AudioManager] ❌ Playback error:', status.error);
        this._isPlaying = false;
      }
    }
  }
}

export default AudioManager;
