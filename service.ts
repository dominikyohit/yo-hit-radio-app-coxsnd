
import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * TrackPlayer Background Playback Service
 * 
 * This service handles remote control events (notification controls, lock screen controls, headset buttons)
 * when the app is in the background or the screen is locked.
 * 
 * CRITICAL: This service MUST be registered in index.ts BEFORE 'expo-router/entry'
 * 
 * Features:
 * - ✅ Android Foreground Service with media notification
 * - ✅ iOS lock screen controls with Now Playing metadata
 * - ✅ Remote control events (Play/Pause/Stop/Seek)
 * - ✅ Persistent notification on Android (visible in notification shade + lock screen)
 * - ✅ Background playback continues when app is minimized/locked
 */
export async function playbackService() {
  console.log('[TrackPlayer Service] 🎵 Playback service initialized');
  console.log('[TrackPlayer Service] 📱 Listening for remote control events');

  // Remote Play - User taps Play button in notification or lock screen
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log('[TrackPlayer Service] ▶️ Remote Play event received');
    console.log('[TrackPlayer Service] 📱 User tapped Play button in notification/lock screen');
    await TrackPlayer.play();
    console.log('[TrackPlayer Service] ✅ Playback started from remote control');
  });

  // Remote Pause - User taps Pause button in notification or lock screen
  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    console.log('[TrackPlayer Service] ⏸️ Remote Pause event received');
    console.log('[TrackPlayer Service] 📱 User tapped Pause button in notification/lock screen');
    await TrackPlayer.pause();
    console.log('[TrackPlayer Service] ✅ Playback paused from remote control');
  });

  // Remote Stop - User taps Stop button in notification or swipes away notification
  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log('[TrackPlayer Service] 🛑 Remote Stop event received');
    console.log('[TrackPlayer Service] 📱 User tapped Stop button or swiped away notification');
    await TrackPlayer.stop();
    console.log('[TrackPlayer Service] ✅ Playback stopped from remote control');
  });

  // Remote Seek - User seeks to a position (for non-live streams)
  TrackPlayer.addEventListener(Event.RemoteSeek, async ({ position }) => {
    console.log('[TrackPlayer Service] ⏩ Remote Seek event received');
    console.log('[TrackPlayer Service] 📱 User seeked to position:', position);
    await TrackPlayer.seekTo(position);
    console.log('[TrackPlayer Service] ✅ Seeked to position:', position);
  });

  // Optional: Remote Next (for playlists)
  // TrackPlayer.addEventListener(Event.RemoteNext, async () => {
  //   console.log('[TrackPlayer Service] ⏭️ Remote Next event received');
  //   await TrackPlayer.skipToNext();
  // });

  // Optional: Remote Previous (for playlists)
  // TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
  //   console.log('[TrackPlayer Service] ⏮️ Remote Previous event received');
  //   await TrackPlayer.skipToPrevious();
  // });

  // Track Changed - Fires when the active track changes
  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (data) => {
    if (data.track) {
      console.log('[TrackPlayer Service] 🎵 Active track changed:', data.track.title);
      console.log('[TrackPlayer Service] 📝 Metadata:', {
        title: data.track.title,
        artist: data.track.artist,
        artwork: data.track.artwork ? 'Yes' : 'No',
      });
    }
  });

  // Playback State Changed - Fires when playback state changes (playing, paused, stopped, buffering)
  TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
    console.log('[TrackPlayer Service] 🔄 Playback state changed:', data.state);
  });

  // Playback Error - Fires when an error occurs during playback
  TrackPlayer.addEventListener(Event.PlaybackError, (data) => {
    console.error('[TrackPlayer Service] ❌ Playback error:', data.message, data.code);
  });

  console.log('[TrackPlayer Service] ✅ All event listeners registered');
  console.log('[TrackPlayer Service] 🤖 Android: Foreground service ready');
  console.log('[TrackPlayer Service] 🍎 iOS: Lock screen controls ready');
}
