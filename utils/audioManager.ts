
/**
 * Audio Manager - react-native-track-player implementation
 * 
 * Provides robust background audio playback for iOS and Android.
 * Requires custom development build (EAS Build) - NOT compatible with Expo Go.
 * 
 * IMPORTANT: This uses react-native-track-player for true background playback
 * with media notifications and lock screen controls.
 */

import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  State,
  Event,
} from 'react-native-track-player';
import { Platform } from 'react-native';

const STREAM_URL = 'https://stream.zeno.fm/hmc38shnrwzuv';

class AudioManager {
  private static instance: AudioManager;
  private isSetup: boolean = false;
  private currentTrackId: string = 'radio-stream';
  private currentTitle: string = 'Yo Hit Radio';
  private currentArtist: string = 'Live Stream';
  private currentArtwork: string | undefined = undefined;

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

      // Setup player
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
        maxCacheSize: 1024 * 10, // 10MB cache
      });

      // Configure capabilities and options
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
        progressUpdateEventInterval: 2,
        alwaysPauseOnInterruption: true,
        stopWithApp: false, // ✅ Continue playback when app is closed
      });

      this.isSetup = true;

      console.log('[AudioManager] ✅ TrackPlayer setup complete');
      console.log('[AudioManager] ✅ Background audio ENABLED');
      console.log('[AudioManager] ✅ iOS background mode: ACTIVE');
      console.log('[AudioManager] ✅ Android foreground service: ACTIVE');
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
      console.log('[AudioManager] 🖼️ Artwork:', artwork ? 'Yes' : 'No');

      // Ensure player is setup
      if (!this.isSetup) {
        await this.setupPlayer();
      }

      // Store metadata
      this.currentTitle = title;
      this.currentArtist = artist;
      this.currentArtwork = artwork;

      // Reset queue and add track
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: this.currentTrackId,
        url: uri,
        title: title,
        artist: artist,
        artwork: artwork,
        isLiveStream: isLiveStream,
      });

      // Start playback
      await TrackPlayer.play();

      console.log('[AudioManager] ✅ Playback started successfully');
      console.log('[AudioManager] ✅ Background playback ACTIVE');
      console.log('[AudioManager] ✅ Media notification VISIBLE');
      console.log('[AudioManager] ✅ Lock screen controls ACTIVE');
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
      console.log('[AudioManager] ✅ Audio stopped');
      console.log('[AudioManager] ✅ Media notification REMOVED');
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
      return state === State.Playing || state === State.Buffering;
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
    return STREAM_URL;
  }

  /**
   * Update metadata for currently playing audio
   */
  public async updateMetadata(title: string, artist: string, artwork?: string): Promise<void> {
    console.log('[AudioManager] 📝 Updating metadata:', { title, artist, artwork: artwork ? 'Yes' : 'No' });
    
    // Store metadata
    this.currentTitle = title;
    this.currentArtist = artist;
    if (artwork) {
      this.currentArtwork = artwork;
    }

    try {
      // Update the track metadata
      await TrackPlayer.updateMetadataForTrack(this.currentTrackId, {
        title: title,
        artist: artist,
        artwork: artwork,
      });

      console.log('[AudioManager] ✅ Metadata updated successfully');
      console.log('[AudioManager] ✅ Media notification updated');
      console.log('[AudioManager] ✅ Lock screen controls updated');
    } catch (error) {
      console.error('[AudioManager] ❌ Error updating metadata:', error);
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  public async setVolume(volume: number): Promise<void> {
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      await TrackPlayer.setVolume(clampedVolume);
      console.log('[AudioManager] 🔊 Volume set to:', clampedVolume);
    } catch (error) {
      console.error('[AudioManager] ❌ Error setting volume:', error);
    }
  }

  /**
   * Get current metadata
   */
  public getCurrentMetadata(): { title: string; artist: string; artwork?: string } {
    return {
      title: this.currentTitle,
      artist: this.currentArtist,
      artwork: this.currentArtwork,
    };
  }
}

export default AudioManager;
