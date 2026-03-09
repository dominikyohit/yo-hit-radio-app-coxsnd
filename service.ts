
/**
 * Placeholder service file for compatibility
 * 
 * This file is no longer needed with expo-audio, but is kept
 * to prevent import errors in existing code.
 * 
 * expo-audio does not require a separate background service registration
 * like react-native-track-player did.
 */

export async function playbackService() {
  console.log('[PlaybackService] ℹ️ Using expo-audio - no separate service needed');
  // expo-audio handles background playback automatically via Audio.setAudioModeAsync
}
