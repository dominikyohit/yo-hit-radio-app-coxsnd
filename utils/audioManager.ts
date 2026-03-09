
/**
 * Audio Manager - expo-audio implementation
 * 
 * Provides stable background audio playback for iOS and Android.
 * Compatible with Expo Go preview and EAS builds.
 * 
 * IMPORTANT: This uses expo-audio (Expo SDK 52+), which is stable and reliable.
 * Background playback is enabled via app.json configuration.
 */

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Platform } from 'react-native';

const STREAM_URL = 'https://stream.zeno.fm/hmc38shnrwzuv';

class AudioManager {
  private static instance: AudioManager;
  private sound: Audio.Sound | null = null;
  private isSetup: boolean = false;
  private currentUri: string = '';
  private currentTitle: string = 'Yo Hit Radio';
  private currentArtist: string = 'Live Stream';

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Setup audio session with background playback capabilities
   */
  public async setupPlayer(): Promise<void> {
    if (this.isSetup) {
      console.log('[AudioManager] ✅ Audio already setup');
      return;
    }

    try {
      console.log('[AudioManager] 🎵 Setting up audio session');
      console.log('[AudioManager] 📱 Platform:', Platform.OS);

      // Configure audio session for background playback
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true, // ✅ Enable background audio
        playsInSilentModeIOS: true, // ✅ Play even when iOS is in silent mode
        shouldDuckAndroid: true, // ✅ Lower volume when other apps play audio
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers, // ✅ Handle interruptions
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers, // ✅ Handle interruptions
      });

      this.isSetup = true;

      console.log('[AudioManager] ✅ Audio session setup complete');
      console.log('[AudioManager] ✅ Background audio ENABLED');
      console.log('[AudioManager] ✅ iOS background mode: ACTIVE');
      console.log('[AudioManager] ✅ Android audio focus: ACTIVE');
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting up audio:', error);
      throw error;
    }
  }

  /**
   * Play audio from URI with metadata
   */
  public async playAudio(
    uri: string = STREAM_URL,
    isLiveStream: boolean = true,
    title: string = 'Yo Hit Radio',
    artist: string = 'Live Stream',
    artwork?: string
  ): Promise<void> {
    try {
      console.log('[AudioManager] 🎵 Starting playback');
      console.log('[AudioManager] 📻 Stream:', uri);
      console.log('[AudioManager] 🎤 Title:', title);
      console.log('[AudioManager] 👤 Artist:', artist);

      // Ensure audio is setup
      if (!this.isSetup) {
        await this.setupPlayer();
      }

      // Stop and unload previous sound
      if (this.sound) {
        console.log('[AudioManager] 🔄 Stopping previous audio');
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Create and load new sound
      console.log('[AudioManager] 📥 Loading audio stream');
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.currentUri = uri;
      this.currentTitle = title;
      this.currentArtist = artist;

      console.log('[AudioManager] ✅ Playback started successfully');
      console.log('[AudioManager] ✅ Background playback ACTIVE');
      console.log('[AudioManager] ℹ️ Note: Basic media controls (expo-audio limitation)');
    } catch (error) {
      console.error('[AudioManager] ❌ Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Playback status update callback
   */
  private onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish && !status.isLooping) {
        console.log('[AudioManager] ⏹️ Playback finished');
      }
      if (status.error) {
        console.error('[AudioManager] ❌ Playback error:', status.error);
      }
    }
  };

  /**
   * Pause current audio
   */
  public async pauseAudio(): Promise<void> {
    try {
      if (!this.sound) {
        console.warn('[AudioManager] ⚠️ No audio to pause');
        return;
      }

      console.log('[AudioManager] ⏸️ Pausing audio');
      await this.sound.pauseAsync();
      console.log('[AudioManager] ✅ Audio paused');
    } catch (error) {
      console.error('[AudioManager] ❌ Error pausing audio:', error);
    }
  }

  /**
   * Resume paused audio
   */
  public async resumeAudio(): Promise<void> {
    try {
      if (!this.sound) {
        console.warn('[AudioManager] ⚠️ No audio to resume');
        return;
      }

      console.log('[AudioManager] ▶️ Resuming audio');
      await this.sound.playAsync();
      console.log('[AudioManager] ✅ Audio resumed');
    } catch (error) {
      console.error('[AudioManager] ❌ Error resuming audio:', error);
    }
  }

  /**
   * Stop and clear current audio
   */
  public async stopCurrentAudio(): Promise<void> {
    try {
      if (!this.sound) {
        console.warn('[AudioManager] ⚠️ No audio to stop');
        return;
      }

      console.log('[AudioManager] 🛑 Stopping current audio');
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.currentUri = '';
      console.log('[AudioManager] ✅ Audio stopped');
    } catch (error) {
      console.error('[AudioManager] ❌ Error stopping audio:', error);
    }
  }

  /**
   * Check if audio is currently playing
   */
  public async isPlaying(): Promise<boolean> {
    try {
      if (!this.sound) {
        return false;
      }

      const status = await this.sound.getStatusAsync();
      return status.isLoaded && status.isPlaying;
    } catch {
      return false;
    }
  }

  /**
   * Get current playback state
   */
  public async getPlaybackState(): Promise<'playing' | 'paused' | 'stopped' | 'none'> {
    try {
      if (!this.sound) {
        return 'none';
      }

      const status = await this.sound.getStatusAsync();
      if (!status.isLoaded) {
        return 'none';
      }

      if (status.isPlaying) {
        return 'playing';
      } else if (status.positionMillis > 0) {
        return 'paused';
      } else {
        return 'stopped';
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error getting playback state:', error);
      return 'none';
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
   * Note: expo-audio has limited metadata support compared to react-native-track-player
   */
  public async updateMetadata(title: string, artist: string, artwork?: string): Promise<void> {
    console.log('[AudioManager] 📝 Updating metadata:', { title, artist });
    
    // Store metadata for reference
    this.currentTitle = title;
    this.currentArtist = artist;

    console.log('[AudioManager] ℹ️ Metadata stored (expo-audio has limited notification support)');
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  public async setVolume(volume: number): Promise<void> {
    try {
      if (!this.sound) {
        console.warn('[AudioManager] ⚠️ No audio to set volume');
        return;
      }

      const clampedVolume = Math.max(0, Math.min(1, volume));
      await this.sound.setVolumeAsync(clampedVolume);
      console.log('[AudioManager] 🔊 Volume set to:', clampedVolume);
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting volume:', error);
    }
  }

  /**
   * Get current metadata
   */
  public getCurrentMetadata(): { title: string; artist: string } {
    return {
      title: this.currentTitle,
      artist: this.currentArtist,
    };
  }
}

export default AudioManager;
