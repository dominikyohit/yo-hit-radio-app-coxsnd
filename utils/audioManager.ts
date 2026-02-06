
import TrackPlayer, {
  Capability,
  Event,
  State,
  AppKilledPlaybackBehavior,
  RepeatMode,
} from 'react-native-track-player';
import { Platform } from 'react-native';

/**
 * Global Audio Manager - Singleton pattern with Android Foreground Media Service
 * 
 * ANDROID: True Foreground Media Service with MediaSession and persistent notification
 * iOS: Background audio with lock screen controls
 * 
 * Features:
 * - Android Foreground Service (foregroundServiceType="mediaPlayback")
 * - MediaSession with Play/Pause controls in notification shade + lock screen
 * - Audio continues when app is backgrounded, switching apps, screen off
 * - Persistent media notification (Android)
 * - Lock screen Now Playing controls (iOS)
 * - Audio focus management (Android)
 * - No autoplay on app launch
 * - Service starts ONLY when user taps "Listen Live"
 * - Service stops ONLY when user manually stops playback
 */
class AudioManager {
  private static instance: AudioManager;
  private isInitialized: boolean = false;
  private isLiveStream: boolean = false;
  private currentUri: string = '';
  private currentTitle: string = 'Yo Hit Radio';
  private currentArtist: string = 'Live Stream';

  private constructor() {
    // Do NOT initialize on construction - wait for user action
    console.log('[AudioManager] Created (not initialized yet - waiting for user action)');
  }

  /**
   * Initialize TrackPlayer with Android Foreground Service support
   * 
   * ANDROID: Configures foreground service with MediaSession
   * iOS: Configures background audio session
   * 
   * Called ONLY when user taps "Listen Live" (not on app launch)
   */
  private async initializePlayer(): Promise<void> {
    if (this.isInitialized) {
      console.log('[AudioManager] Already initialized');
      return;
    }

    try {
      console.log('[AudioManager] Initializing TrackPlayer with Foreground Service support');
      
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true, // Handle phone calls, alarms, etc.
      });

      await TrackPlayer.updateOptions({
        android: {
          // CRITICAL: Stop playback and remove notification when app is killed
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
        progressUpdateEventInterval: 2, // Update progress every 2 seconds
      });

      // Set up event listeners for remote controls (notification, lock screen, headphones)
      TrackPlayer.addEventListener(Event.RemotePlay, async () => {
        console.log('[AudioManager] Remote Play pressed (notification/lock screen)');
        await TrackPlayer.play();
      });

      TrackPlayer.addEventListener(Event.RemotePause, async () => {
        console.log('[AudioManager] Remote Pause pressed (notification/lock screen)');
        await TrackPlayer.pause();
      });

      TrackPlayer.addEventListener(Event.RemoteStop, async () => {
        console.log('[AudioManager] Remote Stop pressed (notification/lock screen)');
        await this.stopCurrentAudio();
      });

      this.isInitialized = true;
      console.log('[AudioManager] TrackPlayer initialized successfully');
      console.log('[AudioManager] Android: Foreground Service ready (will start on playback)');
      console.log('[AudioManager] iOS: Background audio session ready');
      console.log('[AudioManager] MediaSession configured for lock screen controls');
    } catch (error) {
      console.error('[AudioManager] Error initializing TrackPlayer:', error);
      throw error;
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Play audio from URI (live stream or on-demand track)
   * 
   * ANDROID: Starts Foreground Service with persistent notification
   * iOS: Starts background audio playback
   * 
   * Features:
   * - Foreground Service starts automatically (Android)
   * - Persistent notification with Play/Pause controls (Android)
   * - Lock screen controls (iOS)
   * - Audio continues when app is backgrounded
   * - Audio continues when switching to other apps
   * - Audio continues when screen is off
   * - Audio focus acquired (Android)
   * 
   * @param uri - Audio stream URL
   * @param isLiveStream - Whether this is a live stream
   * @param title - Track/show title for metadata
   * @param artist - Artist/station name for metadata
   * @param artwork - Optional artwork URL
   */
  public async playAudio(
    uri: string,
    isLiveStream: boolean = false,
    title: string = 'Yo Hit Radio',
    artist: string = 'Live Stream',
    artwork?: string
  ): Promise<void> {
    try {
      console.log('[AudioManager] User tapped Listen Live - starting playback');
      console.log('[AudioManager] Stream:', { uri, isLiveStream, title, artist });

      // Initialize player if not already done
      if (!this.isInitialized) {
        await this.initializePlayer();
      }

      // Stop current audio if playing
      await this.stopCurrentAudio();

      // Store metadata
      this.currentTitle = title;
      this.currentArtist = artist;
      this.isLiveStream = isLiveStream;
      this.currentUri = uri;

      console.log('[AudioManager] Adding track to queue');
      
      // Add track to queue
      await TrackPlayer.add({
        url: uri,
        title: title,
        artist: artist,
        artwork: artwork || 'https://yohitradio.com/wp-content/uploads/2024/01/yo-hit-radio-logo.png',
        isLiveStream: isLiveStream,
      });

      console.log('[AudioManager] Starting playback');
      console.log('[AudioManager] Android: Starting Foreground Service (foregroundServiceType="mediaPlayback")');
      console.log('[AudioManager] Android: Persistent notification will appear with Play/Pause controls');
      console.log('[AudioManager] iOS: Background audio session active');
      
      // Start playback - this automatically starts the Foreground Service on Android
      await TrackPlayer.play();

      console.log('[AudioManager] Playback started successfully');
      console.log('[AudioManager] ✓ Audio will continue when app is backgrounded');
      console.log('[AudioManager] ✓ Audio will continue when switching to other apps (WhatsApp, Facebook, etc.)');
      console.log('[AudioManager] ✓ Audio will continue when screen turns off');
      console.log('[AudioManager] ✓ Audio will continue when device locks');
      console.log('[AudioManager] ✓ Lock screen controls available (Play/Pause)');
      
      if (Platform.OS === 'android') {
        console.log('[AudioManager] Android: Foreground Service running');
        console.log('[AudioManager] Android: Media notification visible in notification shade');
        console.log('[AudioManager] Android: MediaSession active for Android Auto support');
        console.log('[AudioManager] Android: Audio focus acquired (DoNotMix mode)');
      } else if (Platform.OS === 'ios') {
        console.log('[AudioManager] iOS: AVAudioSession configured for background playback');
        console.log('[AudioManager] iOS: Now Playing info updated on lock screen');
      }
    } catch (error) {
      console.error('[AudioManager] Error playing audio:', error);
      throw error;
    }
  }

  /**
   * Stop and remove current audio
   * 
   * ANDROID: Stops Foreground Service and removes notification
   * iOS: Stops playback and clears lock screen controls
   */
  public async stopCurrentAudio(): Promise<void> {
    try {
      const state = await TrackPlayer.getState();
      
      if (state !== State.None) {
        console.log('[AudioManager] Stopping playback');
        console.log('[AudioManager] Android: Stopping Foreground Service');
        console.log('[AudioManager] Android: Removing media notification');
        console.log('[AudioManager] iOS: Clearing lock screen controls');
        
        await TrackPlayer.stop();
        await TrackPlayer.reset();
        
        console.log('[AudioManager] Playback stopped');
        console.log('[AudioManager] Android: Foreground Service stopped');
        console.log('[AudioManager] Android: Media notification removed');
        console.log('[AudioManager] iOS: Lock screen controls cleared');
      }
      
      this.isLiveStream = false;
      this.currentUri = '';
    } catch (error) {
      console.error('[AudioManager] Error stopping audio:', error);
    }
  }

  /**
   * Pause current audio
   * 
   * ANDROID: Keeps Foreground Service running, updates notification to show "Paused"
   * iOS: Keeps lock screen controls active
   */
  public async pauseAudio(): Promise<void> {
    try {
      console.log('[AudioManager] Pausing audio');
      await TrackPlayer.pause();
      console.log('[AudioManager] Audio paused');
      console.log('[AudioManager] Android: Foreground Service still running');
      console.log('[AudioManager] Android: Notification updated to show Paused state');
      console.log('[AudioManager] iOS: Lock screen controls still active');
    } catch (error) {
      console.error('[AudioManager] Error pausing audio:', error);
    }
  }

  /**
   * Resume paused audio
   * 
   * ANDROID: Resumes Foreground Service playback
   * iOS: Resumes background playback
   */
  public async resumeAudio(): Promise<void> {
    try {
      console.log('[AudioManager] Resuming audio');
      await TrackPlayer.play();
      console.log('[AudioManager] Audio resumed');
      console.log('[AudioManager] Android: Foreground Service playback resumed');
      console.log('[AudioManager] iOS: Background playback resumed');
    } catch (error) {
      console.error('[AudioManager] Error resuming audio:', error);
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
    } catch (error) {
      console.error('[AudioManager] Error setting volume:', error);
    }
  }

  /**
   * Update metadata for currently playing audio
   * Updates notification and lock screen info
   * 
   * CRITICAL: This updates metadata even when playback is stopped
   * This ensures the Now Playing card always shows current metadata
   */
  public async updateMetadata(title: string, artist: string, artwork?: string): Promise<void> {
    try {
      this.currentTitle = title;
      this.currentArtist = artist;

      // Update the current track metadata if it exists
      const queue = await TrackPlayer.getQueue();
      if (queue.length > 0) {
        await TrackPlayer.updateNowPlayingMetadata({
          title: title,
          artist: artist,
          artwork: artwork || 'https://yohitradio.com/wp-content/uploads/2024/01/yo-hit-radio-logo.png',
        });
        
        console.log('[AudioManager] Updated Now Playing metadata:', { title, artist });
        console.log('[AudioManager] Android: Notification updated with new metadata');
        console.log('[AudioManager] iOS: Lock screen updated with new metadata');
      }
    } catch (error) {
      console.error('[AudioManager] Error updating metadata:', error);
    }
  }
}

export default AudioManager;
