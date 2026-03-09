
/**
 * React Native Track Player - Background Playback Service
 * 
 * This service runs in a native Android Foreground Service, ensuring:
 * - Audio continues playing when app is backgrounded
 * - Media notification with controls (Play/Pause/Stop)
 * - Lock screen controls
 * - Survives app being killed by system (with proper configuration)
 * 
 * CRITICAL: This file is registered in index.ts and runs in a separate thread
 * from the React Native JS thread, providing true background audio capability.
 */

import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * Playback Service
 * 
 * Handles remote control events from:
 * - Android media notification (notification shade + lock screen)
 * - iOS lock screen controls
 * - Bluetooth/headphone controls
 * - Android Auto / CarPlay
 */
export async function playbackService() {
  // Check if TrackPlayer is available
  if (!TrackPlayer || typeof TrackPlayer.addEventListener !== 'function') {
    console.warn('[PlaybackService] ⚠️ TrackPlayer is not available. Background playback service cannot start.');
    return;
  }

  console.log('[PlaybackService] 🎵 Background playback service started');
  console.log('[PlaybackService] 📱 Service running in native foreground service');
  console.log('[PlaybackService] ✅ Audio will continue in background');

  // Remote Play - User taps Play button in notification or lock screen
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log('[PlaybackService] ▶️ Remote Play event - User tapped Play');
    await TrackPlayer.play();
  });

  // Remote Pause - User taps Pause button in notification or lock screen
  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    console.log('[PlaybackService] ⏸️ Remote Pause event - User tapped Pause');
    await TrackPlayer.pause();
  });

  // Remote Stop - User taps Stop button or dismisses notification
  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log('[PlaybackService] 🛑 Remote Stop event - User tapped Stop or dismissed notification');
    await TrackPlayer.stop();
    await TrackPlayer.reset();
  });

  // Remote Seek - User seeks to a position (for on-demand tracks, not live streams)
  TrackPlayer.addEventListener(Event.RemoteSeek, async (event: any) => {
    console.log('[PlaybackService] ⏩ Remote Seek event - User seeked to position:', event.position);
    await TrackPlayer.seekTo(event.position);
  });

  // Remote Skip to Next - User taps Next button (if you have multiple tracks)
  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    console.log('[PlaybackService] ⏭️ Remote Next event - User tapped Next');
    await TrackPlayer.skipToNext();
  });

  // Remote Skip to Previous - User taps Previous button (if you have multiple tracks)
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    console.log('[PlaybackService] ⏮️ Remote Previous event - User tapped Previous');
    await TrackPlayer.skipToPrevious();
  });

  console.log('[PlaybackService] ✅ All remote control event listeners registered');
  console.log('[PlaybackService] 🤖 Android: Media notification controls active');
  console.log('[PlaybackService] 🍎 iOS: Lock screen controls active');
}
