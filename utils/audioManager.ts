
/**
 * Audio Manager - react-native-track-player wrapper
 * 
 * Provides background audio playback with:
 * - Android media notification with controls
 * - iOS lock screen controls
 * - Background playback (continues when app is minimized/locked)
 */

import { Platform } from 'react-native';

// Conditionally import TrackPlayer to prevent crashes in Expo Go/web
let TrackPlayer: any = null;
let Capability: any = null;
let AppKilledPlaybackBehavior: any = null;
let RepeatMode: any = null;
let State: any = null;

try {
  const trackPlayerModule = require('react-native-track-player');
  TrackPlayer = trackPlayerModule.default;
  Capability = trackPlayerModule.Capability;
  AppKilledPlaybackBehavior = trackPlayerModule.AppKilledPlaybackBehavior;
  RepeatMode = trackPlayerModule.RepeatMode;
  State = trackPlayerModule.State;
} catch (error) {
  console.warn('[AudioManager] ⚠️ TrackPlayer native module not available. This is expected in Expo Go or web preview.');
}

// Check if TrackPlayer is available (not available in Expo Go or web preview)
const isTrackPlayerAvailable = TrackPlayer && typeof TrackPlayer.setupPlayer === 'function';

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
   * Setup TrackPlayer with background playback configuration
   */
  public async setupPlayer(): Promise<void> {
    if (!isTrackPlayerAvailable) {
      console.warn('[AudioManager] ⚠️ TrackPlayer is not available in this environment. Background audio will not work. Please use a custom development client or built APK/AAB.');
      return;
    }

    if (this.isSetup) {
      console.log('[AudioManager] ✅ Player already setup');
      return;
    }

    try {
      console.log('[AudioManager] 🎵 Setting up TrackPlayer for background playback');
      console.log('[AudioManager] 📱 Platform:', Platform.OS);

      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
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
        progressUpdateEventInterval: 2,
      });

      await TrackPlayer.setRepeatMode(RepeatMode.Off);

      this.isSetup = true;

      console.log('[AudioManager] ✅ TrackPlayer setup complete');
      console.log('[AudioManager] ✅ Background playback ENABLED');
      
      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Media notification will appear when playing');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: Lock screen controls enabled');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting up player:', error);
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
    if (!isTrackPlayerAvailable) {
      console.warn('[AudioManager] ⚠️ TrackPlayer is not available. Cannot play audio in this environment.');
      return;
    }

    try {
      console.log('[AudioManager] 🎵 Starting playback');
      console.log('[AudioManager] 📻 Stream:', uri);
      console.log('[AudioManager] 🎤 Title:', title);
      console.log('[AudioManager] 👤 Artist:', artist);

      // Ensure player is setup
      if (!this.isSetup) {
        await this.setupPlayer();
      }

      // Reset player and add track
      await TrackPlayer.reset();
      
      await TrackPlayer.add({
        url: uri,
        title: title,
        artist: artist,
        artwork: artwork,
        isLiveStream: isLiveStream,
      });

      await TrackPlayer.play();

      this.currentUri = uri;

      console.log('[AudioManager] ✅ Playback started successfully');
      console.log('[AudioManager] ✅ Background playback ACTIVE');
      
      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Media notification NOW VISIBLE');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: Lock screen controls NOW ACTIVE');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Pause current audio
   */
  public async pauseAudio(): Promise<void> {
    if (!isTrackPlayerAvailable) {
      console.warn('[AudioManager] ⚠️ TrackPlayer is not available. Cannot pause audio.');
      return;
    }

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
    if (!isTrackPlayerAvailable) {
      console.warn('[AudioManager] ⚠️ TrackPlayer is not available. Cannot resume audio.');
      return;
    }

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
    if (!isTrackPlayerAvailable) {
      console.warn('[AudioManager] ⚠️ TrackPlayer is not available. Cannot stop audio.');
      return;
    }

    try {
      console.log('[AudioManager] 🛑 Stopping current audio');
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
    if (!isTrackPlayerAvailable || !State) {
      return false;
    }

    try {
      const state = await TrackPlayer.getState();
      return state === State.Playing;
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
   */
  public async updateMetadata(title: string, artist: string, artwork?: string): Promise<void> {
    if (!isTrackPlayerAvailable) {
      console.warn('[AudioManager] ⚠️ TrackPlayer is not available. Cannot update metadata.');
      return;
    }

    try {
      console.log('[AudioManager] 📝 Updating metadata:', { title, artist });
      
      const currentTrack = await TrackPlayer.getActiveTrackIndex();
      if (currentTrack !== undefined && currentTrack !== null) {
        await TrackPlayer.updateNowPlayingMetadata({
          title,
          artist,
          artwork,
        });
        
        console.log('[AudioManager] ✅ Metadata updated');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error updating metadata:', error);
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  public async setVolume(volume: number): Promise<void> {
    if (!isTrackPlayerAvailable) {
      console.warn('[AudioManager] ⚠️ TrackPlayer is not available. Cannot set volume.');
      return;
    }

    try {
      await TrackPlayer.setVolume(Math.max(0, Math.min(1, volume)));
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting volume:', error);
    }
  }
}

export default AudioManager;
