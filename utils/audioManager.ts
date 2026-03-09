
/**
 * Audio Manager - react-native-track-player wrapper
 * 
 * Provides robust background audio playback with Android Foreground Service
 * and iOS background audio support. Includes media controls and notifications.
 * 
 * IMPORTANT: This requires a custom development build (EAS Build).
 * Standard Expo Go preview will NOT work with this native module.
 */

import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  State,
  Event,
  Track,
} from 'react-native-track-player';
import { Platform } from 'react-native';

const STREAM_URL = 'https://stream.zeno.fm/hmc38shnrwzuv';
const DEFAULT_ARTWORK = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400';

class AudioManager {
  private static instance: AudioManager;
  private isSetup: boolean = false;
  private currentUri: string = '';

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Setup TrackPlayer with background playback capabilities
   */
  public async setupPlayer(): Promise<void> {
    if (this.isSetup) {
      console.log('[AudioManager] ✅ TrackPlayer already setup');
      return;
    }

    try {
      console.log('[AudioManager] 🎵 Setting up TrackPlayer');
      console.log('[AudioManager] 📱 Platform:', Platform.OS);

      // Initialize TrackPlayer
      await TrackPlayer.setupPlayer({
        maxCacheSize: 1024 * 10, // 10MB cache for streaming
      });

      // Configure capabilities and notification
      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
      });

      this.isSetup = true;

      console.log('[AudioManager] ✅ TrackPlayer setup complete');
      console.log('[AudioManager] ✅ Background audio ENABLED');
      console.log('[AudioManager] ✅ Foreground service ENABLED (Android)');
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting up TrackPlayer:', error);
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

      // Ensure TrackPlayer is setup
      if (!this.isSetup) {
        await this.setupPlayer();
      }

      // Reset queue and add new track
      await TrackPlayer.reset();

      const track: Track = {
        url: uri,
        title: title,
        artist: artist,
        artwork: artwork || DEFAULT_ARTWORK,
        isLiveStream: isLiveStream,
      };

      await TrackPlayer.add(track);
      await TrackPlayer.play();

      this.currentUri = uri;

      console.log('[AudioManager] ✅ Playback started successfully');
      console.log('[AudioManager] ✅ Media notification ACTIVE');
      console.log('[AudioManager] ✅ Background playback ACTIVE');
    } catch (error) {
      console.error('[AudioManager] ❌ Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Pause current audio
   */
  public async pauseAudio(): Promise<void> {
    try {
      console.log('[AudioManager] ⏸️ Pausing audio');
      await TrackPlayer.pause();
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
      console.log('[AudioManager] ▶️ Resuming audio');
      await TrackPlayer.play();
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
      console.log('[AudioManager] 🛑 Stopping current audio');
      await TrackPlayer.stop();
      await TrackPlayer.reset();
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
      const state = await TrackPlayer.getState();
      return state === State.Playing;
    } catch {
      return false;
    }
  }

  /**
   * Get current playback state
   */
  public async getPlaybackState(): Promise<State> {
    try {
      return await TrackPlayer.getState();
    } catch (error) {
      console.error('[AudioManager] ❌ Error getting playback state:', error);
      return State.None;
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
   */
  public async updateMetadata(title: string, artist: string, artwork?: string): Promise<void> {
    try {
      console.log('[AudioManager] 📝 Updating metadata:', { title, artist });
      
      const currentTrack = await TrackPlayer.getActiveTrack();
      if (!currentTrack) {
        console.warn('[AudioManager] ⚠️ No active track to update');
        return;
      }

      // Update the track in the queue
      await TrackPlayer.updateNowPlayingMetadata({
        title: title,
        artist: artist,
        artwork: artwork || currentTrack.artwork || DEFAULT_ARTWORK,
      });

      console.log('[AudioManager] ✅ Metadata updated');
    } catch (error) {
      console.error('[AudioManager] ❌ Error updating metadata:', error);
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  public async setVolume(volume: number): Promise<void> {
    try {
      await TrackPlayer.setVolume(Math.max(0, Math.min(1, volume)));
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting volume:', error);
    }
  }
}

export default AudioManager;
