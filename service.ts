
/**
 * TrackPlayer Background Service
 * 
 * Handles remote control events (play, pause, stop) from:
 * - Media notification (Android)
 * - Lock screen controls (iOS)
 * - Bluetooth/headphone controls
 * - Car audio systems
 */

import TrackPlayer, { Event } from 'react-native-track-player';

export async function playbackService() {
  console.log('[PlaybackService] 🎵 Registering event handlers');

  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log('[PlaybackService] ▶️ Remote Play event');
    await TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    console.log('[PlaybackService] ⏸️ Remote Pause event');
    await TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log('[PlaybackService] 🛑 Remote Stop event');
    await TrackPlayer.stop();
  });

  TrackPlayer.addEventListener(Event.PlaybackState, async ({ state }) => {
    console.log('[PlaybackService] 📊 Playback state changed:', state);
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async ({ track }) => {
    console.log('[PlaybackService] 🎵 Active track changed:', track?.title);
  });

  console.log('[PlaybackService] ✅ Event handlers registered');
}
