
import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * TrackPlayer Playback Service
 * 
 * This service runs in the background on Android to handle audio playback
 * when the app is not in the foreground. It's required for:
 * - Background audio playback
 * - Foreground Service with media notification
 * - Lock screen controls
 * - MediaSession integration
 * 
 * The service handles remote control events (notification buttons, lock screen, headphones)
 */
module.exports = async function() {
  console.log('[TrackPlayer Service] Playback service registered');
  
  // Handle remote play event (notification, lock screen, headphones)
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    console.log('[TrackPlayer Service] Remote Play event');
    await TrackPlayer.play();
  });

  // Handle remote pause event
  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    console.log('[TrackPlayer Service] Remote Pause event');
    await TrackPlayer.pause();
  });

  // Handle remote stop event
  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    console.log('[TrackPlayer Service] Remote Stop event');
    await TrackPlayer.stop();
  });

  // Handle remote next event (if needed in future)
  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    console.log('[TrackPlayer Service] Remote Next event');
    // For live stream, this might skip to next show or do nothing
  });

  // Handle remote previous event (if needed in future)
  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    console.log('[TrackPlayer Service] Remote Previous event');
    // For live stream, this might go to previous show or do nothing
  });

  // Handle playback errors
  TrackPlayer.addEventListener(Event.PlaybackError, async (error) => {
    console.error('[TrackPlayer Service] Playback error:', error);
  });

  console.log('[TrackPlayer Service] All event listeners registered');
};
