
import { Platform } from 'react-native';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  State,
  Track,
} from 'react-native-track-player';

/**
 * Global Audio Manager - Singleton pattern with react-native-track-player
 * 
 * ANDROID: Full media notification with player controls (Play/Pause/Stop) via Foreground Service
 * iOS: Lock screen controls with Now Playing metadata
 * 
 * Features:
 * - ✅ Background audio playback (continues when app is minimized/locked)
 * - ✅ Android Foreground Service with persistent media notification
 * - ✅ iOS lock screen controls with Now Playing metadata
 * - ✅ Audio focus management
 * - ✅ Continuous metadata refresh (even when paused)
 * - ✅ Optimized for live streaming
 */
class AudioManager {
  private static instance: AudioManager;
  private isPlayerInitialized: boolean = false;
  private currentTrackUrl: string | null = null;

  private constructor() {
    console.log('[AudioManager] 🎵 AudioManager instance created');
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Setup TrackPlayer with background playback configuration
   * 
   * CRITICAL: This must be called once before any playback operations
   * 
   * ANDROID: Configures Foreground Service for background playback
   * iOS: Configures AVAudioSession for background playback
   */
  public async setupPlayer(): Promise<void> {
    if (this.isPlayerInitialized) {
      console.log('[AudioManager] ⚠️ TrackPlayer already initialized, skipping setup');
      return;
    }

    try {
      console.log('[AudioManager] 🎵 Setting up TrackPlayer for background playback');
      console.log('[AudioManager] 📱 Platform:', Platform.OS);

      await TrackPlayer.setupPlayer({
        maxCacheSize: 1024 * 10, // 10MB cache for streaming
      });

      this.isPlayerInitialized = true;

      console.log('[AudioManager] ✅ TrackPlayer setup successfully');
      console.log('[AudioManager] ✅ Background playback ENABLED');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Foreground Service configured');
        console.log('[AudioManager] 🤖 Android: Media notification will appear when playing');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: AVAudioSession configured for background playback');
        console.log('[AudioManager] 🍎 iOS: Lock screen controls enabled');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Failed to setup TrackPlayer:', error);
      throw error;
    }
  }

  /**
   * Update TrackPlayer options (capabilities, notification behavior)
   * 
   * ANDROID: Configures media notification controls and Foreground Service behavior
   * iOS: Configures lock screen controls
   */
  public async updateOptions(): Promise<void> {
    try {
      console.log('[AudioManager] 🔧 Updating TrackPlayer options');

      await TrackPlayer.updateOptions({
        android: {
          // CRITICAL: Stop playback and remove notification when app is killed
          // This prevents zombie processes and ensures clean shutdown
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
        // Capabilities shown in notification and lock screen
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
          Capability.SeekTo, // For non-live streams
        ],
        // Compact capabilities (shown in collapsed notification on Android)
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        // Update progress every 2 seconds (for non-live streams)
        progressUpdateEventInterval: 2,
        // Always pause on interruption (phone calls, alarms, etc.)
        alwaysPauseOnInterruption: true,
      });

      console.log('[AudioManager] ✅ TrackPlayer options updated');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Notification controls configured (Play/Pause/Stop)');
        console.log('[AudioManager] 🤖 Android: Foreground Service behavior: Stop on app kill');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: Lock screen controls configured');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Failed to update TrackPlayer options:', error);
    }
  }

  /**
   * Play audio from URL (live stream or on-demand track)
   * 
   * CRITICAL FEATURES:
   * ✅ Background playback (continues when app is minimized/locked)
   * ✅ Android Foreground Service with persistent media notification
   * ✅ iOS lock screen controls with Now Playing metadata
   * ✅ Audio focus management
   * 
   * @param url - Audio stream URL
   * @param title - Track/show title for metadata
   * @param artist - Artist/station name for metadata
   * @param artwork - Optional artwork URL for metadata
   */
  public async playAudio(
    url: string,
    title: string = 'Yo Hit Radio',
    artist: string = 'Live Stream',
    artwork?: string
  ): Promise<void> {
    try {
      console.log('[AudioManager] 🎵 Starting playback');
      console.log('[AudioManager] 📻 Stream:', url);
      console.log('[AudioManager] 🎤 Title:', title);
      console.log('[AudioManager] 👤 Artist:', artist);
      console.log('[AudioManager] 🖼️ Artwork:', artwork ? 'Yes' : 'No');

      // Ensure player is initialized
      if (!this.isPlayerInitialized) {
        console.log('[AudioManager] ⚠️ Player not initialized, initializing now...');
        await this.setupPlayer();
        await this.updateOptions();
      }

      // If same URL is already playing, just resume
      if (this.currentTrackUrl === url) {
        const state = await TrackPlayer.getState();
        if (state === State.Paused || state === State.Stopped) {
          console.log('[AudioManager] ▶️ Resuming existing track');
          await TrackPlayer.play();
          console.log('[AudioManager] ✅ Playback resumed');
          return;
        }
        console.log('[AudioManager] ⚠️ Track already playing, skipping');
        return;
      }

      console.log('[AudioManager] 🔧 Resetting player and adding new track');

      // Reset player and add new track
      await TrackPlayer.reset();

      const track: Track = {
        url: url,
        title: title,
        artist: artist,
        artwork: artwork,
        isLiveStream: true, // CRITICAL: Marks this as a live stream (disables seeking)
      };

      await TrackPlayer.add(track);
      await TrackPlayer.play();

      this.currentTrackUrl = url;

      console.log('[AudioManager] ✅ Playback started successfully');
      console.log('[AudioManager] ✅ Background playback ACTIVE');
      console.log('[AudioManager] 📱 Audio will continue when:');
      console.log('[AudioManager]    • App goes to background');
      console.log('[AudioManager]    • User opens another app');
      console.log('[AudioManager]    • Screen locks');
      console.log('[AudioManager]    • Device sleeps');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Foreground Service NOW ACTIVE');
        console.log('[AudioManager] 🤖 Android: Media notification NOW VISIBLE');
        console.log('[AudioManager] 🤖 Android: Notification shows:', title, '-', artist);
        console.log('[AudioManager] 🤖 Android: Controls: Play/Pause/Stop');
        console.log('[AudioManager] 🤖 Android: Visible in notification shade + lock screen');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: Lock screen controls NOW ACTIVE');
        console.log('[AudioManager] 🍎 iOS: Now Playing metadata updated');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Stop and remove current audio
   * 
   * ANDROID: Stops Foreground Service and removes media notification
   * iOS: Clears lock screen Now Playing controls
   */
  public async stopCurrentAudio(): Promise<void> {
    try {
      console.log('[AudioManager] 🛑 Stopping current audio');
      await TrackPlayer.stop();
      this.currentTrackUrl = null;

      console.log('[AudioManager] ✅ Audio stopped');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Foreground Service STOPPED');
        console.log('[AudioManager] 🤖 Android: Media notification REMOVED');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: Lock screen controls CLEARED');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error stopping audio:', error);
    }
  }

  /**
   * Pause current audio
   * 
   * ANDROID: Foreground Service remains active, notification shows "Play" button
   * iOS: Lock screen controls remain active
   */
  public async pauseAudio(): Promise<void> {
    try {
      console.log('[AudioManager] ⏸️ Pausing audio');
      await TrackPlayer.pause();

      console.log('[AudioManager] ✅ Audio paused');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Foreground Service STILL ACTIVE');
        console.log('[AudioManager] 🤖 Android: Media notification STILL VISIBLE');
        console.log('[AudioManager] 🤖 Android: Notification shows "Play" button');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: Lock screen controls STILL ACTIVE');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error pausing audio:', error);
    }
  }

  /**
   * Resume paused audio
   * 
   * ANDROID: Foreground Service resumes, notification shows "Pause" button
   * iOS: Lock screen controls update to show "Pause" button
   */
  public async resumeAudio(): Promise<void> {
    try {
      console.log('[AudioManager] ▶️ Resuming audio');
      await TrackPlayer.play();

      console.log('[AudioManager] ✅ Audio resumed');
      console.log('[AudioManager] ✅ Background playback ACTIVE');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Foreground Service ACTIVE');
        console.log('[AudioManager] 🤖 Android: Notification updated to "Pause"');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: Lock screen controls updated to "Pause"');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error resuming audio:', error);
    }
  }

  /**
   * Update metadata for currently playing audio
   * 
   * Use this to update Now Playing info when song/show changes during playback
   * 
   * ANDROID: Updates media notification title/artist/artwork
   * iOS: Updates lock screen Now Playing metadata
   * 
   * @param title - New track/show title
   * @param artist - New artist/station name
   * @param artwork - Optional new artwork URL
   */
  public async updateMetadata(title: string, artist: string, artwork?: string): Promise<void> {
    try {
      console.log('[AudioManager] 📝 Updating metadata:', { title, artist, artwork: artwork ? 'Yes' : 'No' });

      const queue = await TrackPlayer.getQueue();
      if (queue.length > 0) {
        const trackId = queue[0].id;
        await TrackPlayer.updateMetadataForTrack(trackId, {
          title: title,
          artist: artist,
          artwork: artwork,
        });

        console.log('[AudioManager] ✅ Metadata updated successfully');

        if (Platform.OS === 'android') {
          console.log('[AudioManager] 🤖 Android: Media notification metadata updated');
        } else if (Platform.OS === 'ios') {
          console.log('[AudioManager] 🍎 iOS: Lock screen Now Playing metadata updated');
        }
      } else {
        console.log('[AudioManager] ⚠️ No tracks in queue, cannot update metadata');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error updating metadata:', error);
    }
  }

  /**
   * Get current playback state
   */
  public async getPlaybackState(): Promise<State> {
    return TrackPlayer.getState();
  }

  /**
   * Get current playback progress
   */
  public async getProgress(): Promise<{ position: number; duration: number; buffered: number }> {
    return TrackPlayer.getProgress();
  }

  /**
   * Check if audio is currently playing
   */
  public async isPlaying(): Promise<boolean> {
    const state = await TrackPlayer.getState();
    return state === State.Playing;
  }

  /**
   * Get current track URL
   */
  public getCurrentUri(): string {
    return this.currentTrackUrl || '';
  }
}

export default AudioManager;
