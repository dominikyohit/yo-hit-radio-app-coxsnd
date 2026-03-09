
/**
 * Background Playback Service for react-native-track-player
 * 
 * This service handles remote control events (play, pause, stop) from:
 * - Android notification media controls
 * - iOS lock screen controls
 * - Bluetooth/headphone controls
 * - Android Auto / CarPlay
 * 
 * CRITICAL: This service MUST be registered in index.ts before any other code.
 */

import TrackPlayer, { Event } from 'react-native-track-player';

export async function playbackService() {
  console.log('[PlaybackService] 🎵 Initializing background playback service');

  // Handle remote play command
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log('[PlaybackService] ▶️ Remote play command received');
    await TrackPlayer.play();
  });

  // Handle remote pause command
  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    console.log('[PlaybackService] ⏸️ Remote pause command received');
    await TrackPlayer.pause();
  });

  // Handle remote stop command
  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log('[PlaybackService] 🛑 Remote stop command received');
    await TrackPlayer.stop();
  });

  // Handle playback errors
  TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
    console.error('[PlaybackService] ❌ Playback error:', error);
  });

  // Handle playback state changes
  TrackPlayer.addEventListener(Event.PlaybackState, (state) => {
    console.log('[PlaybackService] 🔄 Playback state changed:', state);
  });

  console.log('[PlaybackService] ✅ Background playback service ready');
  console.log('[PlaybackService] ✅ Remote controls ACTIVE');
  console.log('[PlaybackService] ✅ Foreground service ACTIVE (Android)');
}
