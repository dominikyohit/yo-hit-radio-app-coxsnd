
/**
 * Global Audio Manager - Singleton pattern with react-native-track-player
 * 
 * MIGRATION: Replaced expo-av with react-native-track-player for:
 * - ✅ True Android Foreground Service (mediaPlayback)
 * - ✅ Persistent media notification with controls
 * - ✅ Reliable background playback (survives app backgrounding)
 * - ✅ Lock screen controls on both platforms
 * - ✅ Better battery optimization compatibility
 * 
 * ANDROID: Uses native MediaSession with Foreground Service
 * iOS: Uses AVAudioSession with background audio mode
 */

import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  State,
  Event,
  Track,
} from 'react-native-track-player';
import { Platform } from 'react-native';

class AudioManager {
  private static instance: AudioManager;
  private isInitialized: boolean = false;
  private currentTrackId: string | null = null;
  private currentUri: string = '';
  private isLiveStream: boolean = false;

  private constructor() {
    // Initialization happens in setupPlayer()
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
   * CRITICAL: This must be called before any playback operations.
   * It configures the native audio session and foreground service.
   * 
   * ANDROID: Creates MediaSession and prepares Foreground Service
   * iOS: Configures AVAudioSession for background audio
   */
  public async setupPlayer(): Promise<void> {
    if (this.isInitialized) {
      console.log('[AudioManager] ⚠️ TrackPlayer already initialized');
      return;
    }

    try {
      console.log('[AudioManager] 🎵 Initializing TrackPlayer for background playback');
      console.log('[AudioManager] 📱 Platform:', Platform.OS);

      // Setup player with background playback configuration
      await TrackPlayer.setupPlayer({
        maxCacheSize: 1024 * 10, // 10MB cache for stable streaming
        waitForBuffer: true, // Wait for buffer before playing (prevents stuttering)
      });

      console.log('[AudioManager] ✅ TrackPlayer setup complete');

      // Configure playback options
      await TrackPlayer.updateOptions({
        // Android configuration
        android: {
          // CRITICAL: Stop playback when app is killed by system
          // Options: ContinuePlayback, PausePlayback, StopPlaybackAndRemoveNotification
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },

        // Capabilities - what controls are available
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],

        // Compact capabilities - controls shown in collapsed notification
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],

        // Progress update interval (in seconds)
        progressUpdateEventInterval: 2,

        // iOS specific
        // alwaysPauseOnInterruption: true, // Pause on phone calls, alarms, etc.
      });

      console.log('[AudioManager] ✅ Playback options configured');
      console.log('[AudioManager] ✅ Background playback ENABLED');
      console.log('[AudioManager] 📱 Audio will continue when:');
      console.log('[AudioManager]    • App goes to background');
      console.log('[AudioManager]    • User opens another app');
      console.log('[AudioManager]    • Screen locks');
      console.log('[AudioManager]    • Device sleeps');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Foreground Service configured');
        console.log('[AudioManager] 🤖 Android: Media notification will appear when playing');
        console.log('[AudioManager] 🤖 Android: Notification controls: Play/Pause/Stop');
        console.log('[AudioManager] 🤖 Android: Service type: mediaPlayback');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: AVAudioSession configured for background audio');
        console.log('[AudioManager] 🍎 iOS: Lock screen controls enabled');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting up TrackPlayer:', error);
      throw error;
    }
  }

  /**
   * Play audio from URI (live stream or on-demand track)
   * 
   * CRITICAL FEATURES:
   * ✅ Background playback (continues when app is minimized/locked)
   * ✅ Android media notification with controls (Play/Pause/Stop)
   * ✅ iOS lock screen controls with Now Playing metadata
   * ✅ Foreground Service on Android (survives battery optimization)
   * 
   * @param uri - Audio stream URL
   * @param isLiveStream - Whether this is a live stream (affects buffering behavior)
   * @param title - Track/show title for metadata
   * @param artist - Artist/station name for metadata
   * @param artwork - Optional artwork URL for metadata
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
      console.log('[AudioManager] 🖼️ Artwork:', artwork ? 'Yes' : 'No');

      // Ensure player is initialized
      if (!this.isInitialized) {
        console.log('[AudioManager] ⚠️ TrackPlayer not initialized, initializing now...');
        await this.setupPlayer();
      }

      // Reset player (clear queue)
      await TrackPlayer.reset();
      console.log('[AudioManager] 🔄 Player reset');

      // Create track object
      const track: Track = {
        id: `track-${Date.now()}`, // Unique ID for this track
        url: uri,
        title: title,
        artist: artist,
        artwork: artwork, // Optional artwork URL
        isLiveStream: isLiveStream, // Important for live streams
      };

      // Add track to queue
      await TrackPlayer.add(track);
      console.log('[AudioManager] ➕ Track added to queue');

      // Start playback
      await TrackPlayer.play();
      console.log('[AudioManager] ▶️ Playback started');

      // Store current track info
      this.currentTrackId = track.id;
      this.currentUri = uri;
      this.isLiveStream = isLiveStream;

      console.log('[AudioManager] ✅ Playback started successfully');
      console.log('[AudioManager] ✅ Background playback ACTIVE');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Foreground Service NOW RUNNING');
        console.log('[AudioManager] 🤖 Android: Media notification NOW VISIBLE');
        console.log('[AudioManager] 🤖 Android: Notification shows:', title, '-', artist);
        console.log('[AudioManager] 🤖 Android: Controls available: Play/Pause/Stop');
        console.log('[AudioManager] 🤖 Android: Notification visible in:');
        console.log('[AudioManager]    • Notification shade (swipe down)');
        console.log('[AudioManager]    • Lock screen');
        console.log('[AudioManager] 🤖 Android: Service survives battery optimization');
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
   * Pause current audio
   * 
   * ANDROID: Media notification remains visible with "Play" button
   * iOS: Lock screen controls remain active
   */
  public async pauseAudio(): Promise<void> {
    try {
      console.log('[AudioManager] ⏸️ Pausing audio');
      await TrackPlayer.pause();

      console.log('[AudioManager] ✅ Audio paused');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Media notification STILL VISIBLE');
        console.log('[AudioManager] 🤖 Android: Notification shows "Play" button');
        console.log('[AudioManager] 🤖 Android: Foreground Service STILL RUNNING');
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
   * ANDROID: Media notification updates to show "Pause" button
   * iOS: Lock screen controls update to show "Pause" button
   */
  public async resumeAudio(): Promise<void> {
    try {
      console.log('[AudioManager] ▶️ Resuming audio');
      await TrackPlayer.play();

      console.log('[AudioManager] ✅ Audio resumed');
      console.log('[AudioManager] ✅ Background playback ACTIVE');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Media notification updated to "Pause"');
        console.log('[AudioManager] 🤖 Android: Foreground Service RUNNING');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: Lock screen controls updated to "Pause"');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error resuming audio:', error);
    }
  }

  /**
   * Stop and clear current audio
   * 
   * ANDROID: Removes media notification and stops Foreground Service
   * iOS: Clears lock screen Now Playing controls
   */
  public async stopCurrentAudio(): Promise<void> {
    try {
      console.log('[AudioManager] 🛑 Stopping current audio');
      await TrackPlayer.stop();
      await TrackPlayer.reset(); // Clear the queue

      this.currentTrackId = null;
      this.currentUri = '';
      this.isLiveStream = false;

      console.log('[AudioManager] ✅ Audio stopped');

      if (Platform.OS === 'android') {
        console.log('[AudioManager] 🤖 Android: Media notification REMOVED');
        console.log('[AudioManager] 🤖 Android: Foreground Service STOPPED');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] 🍎 iOS: Lock screen controls CLEARED');
      }
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
    } catch (error) {
      console.error('[AudioManager] ❌ Error checking playback state:', error);
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
   * Get current track
   */
  public async getCurrentTrack(): Promise<Track | undefined> {
    try {
      const trackIndex = await TrackPlayer.getActiveTrackIndex();
      if (trackIndex !== undefined && trackIndex !== null) {
        const track = await TrackPlayer.getTrack(trackIndex);
        return track || undefined;
      }
      return undefined;
    } catch (error) {
      console.error('[AudioManager] ❌ Error getting current track:', error);
      return undefined;
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

      const trackIndex = await TrackPlayer.getActiveTrackIndex();
      if (trackIndex !== undefined && trackIndex !== null) {
        // Update the current track's metadata
        await TrackPlayer.updateMetadataForTrack(trackIndex, {
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
        console.log('[AudioManager] ⚠️ No active track to update metadata');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error updating metadata:', error);
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
    try {
      await TrackPlayer.setVolume(Math.max(0, Math.min(1, volume)));
      console.log('[AudioManager] 🔊 Volume set to:', volume);
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting volume:', error);
    }
  }

  /**
   * Seek to position (in seconds)
   * Note: Not applicable for live streams
   */
  public async seekTo(position: number): Promise<void> {
    try {
      if (!this.isLiveStream) {
        await TrackPlayer.seekTo(position);
        console.log('[AudioManager] ⏩ Seeked to position:', position);
      } else {
        console.log('[AudioManager] ⚠️ Cannot seek in live stream');
      }
    } catch (error) {
      console.error('[AudioManager] ❌ Error seeking:', error);
    }
  }

  /**
   * Get current position (in seconds)
   */
  public async getPosition(): Promise<number> {
    try {
      const position = await TrackPlayer.getPosition();
      return position;
    } catch (error) {
      console.error('[AudioManager] ❌ Error getting position:', error);
      return 0;
    }
  }

  /**
   * Get track duration (in seconds)
   */
  public async getDuration(): Promise<number> {
    try {
      const duration = await TrackPlayer.getDuration();
      return duration;
    } catch (error) {
      console.error('[AudioManager] ❌ Error getting duration:', error);
      return 0;
    }
  }
}

export default AudioManager;
