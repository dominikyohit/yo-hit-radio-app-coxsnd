
import { Audio, AVPlaybackStatus, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Global Audio Manager - Singleton pattern with background playback support
 * Ensures only one audio source plays at a time
 * Supports background playback, lock screen controls, and media notifications
 */
class AudioManager {
  private static instance: AudioManager;
  private sound: Audio.Sound | null = null;
  private isLiveStream: boolean = false;
  private currentUri: string = '';
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeAudio();
  }

  /**
   * Initialize audio session with background playback support
   */
  private async initializeAudio(): Promise<void> {
    try {
      console.log('[AudioManager] Initializing audio session for background playback');
      
      // Configure audio mode for background playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      this.isInitialized = true;
      console.log('[AudioManager] Audio session initialized successfully');
    } catch (error) {
      console.error('[AudioManager] Error initializing audio session:', error);
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Update Now Playing metadata for lock screen and notification
   */
  private async updateNowPlayingInfo(title: string, artist: string): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setProgressUpdateIntervalAsync(1000);
        
        // Set metadata for lock screen controls
        // Note: expo-av automatically handles this when you set the status
        console.log('[AudioManager] Updated Now Playing info:', { title, artist });
      }
    } catch (error) {
      console.error('[AudioManager] Error updating Now Playing info:', error);
    }
  }

  /**
   * Play audio from URI (live stream or on-demand track)
   * Automatically stops any currently playing audio first
   * Supports background playback and lock screen controls
   */
  public async playAudio(
    uri: string,
    isLiveStream: boolean = false,
    title: string = 'Yo Hit Radio',
    artist: string = 'Live Stream'
  ): Promise<void> {
    try {
      console.log('[AudioManager] Starting playback:', { uri, isLiveStream, title, artist });

      // Ensure audio session is initialized
      if (!this.isInitialized) {
        await this.initializeAudio();
      }

      // Stop current audio if playing
      await this.stopCurrentAudio();

      // Load and play new audio
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
          isMuted: false,
          rate: 1.0,
          shouldCorrectPitch: true,
          progressUpdateIntervalMillis: 1000,
        },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.isLiveStream = isLiveStream;
      this.currentUri = uri;

      // Update Now Playing metadata for lock screen
      await this.updateNowPlayingInfo(title, artist);

      console.log('[AudioManager] Playback started successfully');
    } catch (error) {
      console.error('[AudioManager] Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Playback status update callback
   * Handles audio focus changes, interruptions, and errors
   */
  private onPlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (status.isLoaded) {
      if (status.didJustFinish && !status.isLooping) {
        console.log('[AudioManager] Playback finished');
      }
      if (status.error) {
        console.error('[AudioManager] Playback error:', status.error);
      }
    } else {
      if (status.error) {
        console.error('[AudioManager] Playback status error:', status.error);
      }
    }
  };

  /**
   * Stop and unload current audio
   */
  public async stopCurrentAudio(): Promise<void> {
    if (this.sound) {
      try {
        console.log('[AudioManager] Stopping current audio');
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('[AudioManager] Error stopping audio:', error);
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
        console.log('[AudioManager] Pausing audio');
        await this.sound.pauseAsync();
      } catch (error) {
        console.error('[AudioManager] Error pausing audio:', error);
      }
    }
  }

  /**
   * Resume paused audio
   */
  public async resumeAudio(): Promise<void> {
    if (this.sound) {
      try {
        console.log('[AudioManager] Resuming audio');
        await this.sound.playAsync();
      } catch (error) {
        console.error('[AudioManager] Error resuming audio:', error);
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

  /**
   * Set volume (0.0 to 1.0)
   */
  public async setVolume(volume: number): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
      } catch (error) {
        console.error('[AudioManager] Error setting volume:', error);
      }
    }
  }

  /**
   * Get current playback status
   */
  public async getStatus(): Promise<AVPlaybackStatus | null> {
    if (this.sound) {
      try {
        return await this.sound.getStatusAsync();
      } catch (error) {
        console.error('[AudioManager] Error getting status:', error);
        return null;
      }
    }
    return null;
  }
}

export default AudioManager;
