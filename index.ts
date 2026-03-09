
/**
 * Entry point for Expo Router
 * 
 * This file initializes the app and registers the TrackPlayer background service.
 * 
 * IMPORTANT: TrackPlayer requires a custom development build (EAS Build).
 * It will NOT work in Expo Go preview.
 */

import 'expo-router/entry';
import TrackPlayer from 'react-native-track-player';
import { playbackService } from './service';
import { Platform } from 'react-native';

// Register the playback service for background audio
// Only register on native platforms (not web)
if (Platform.OS !== 'web') {
  try {
    TrackPlayer.registerPlaybackService(() => playbackService);
    console.log('[App] ✅ TrackPlayer playback service registered');
    console.log('[App] ✅ Background audio service ACTIVE');
    console.log('[App] ℹ️ Note: Requires custom development build (not Expo Go)');
  } catch (error) {
    console.error('[App] ❌ Failed to register TrackPlayer playback service:', error);
  }
} else {
  console.log('[App] ℹ️ Web platform detected - TrackPlayer not available');
}
