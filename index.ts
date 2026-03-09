
// Initialize Natively console log capture before anything else
import './utils/errorLogger';

// Register TrackPlayer playback service for background audio
// Only register if TrackPlayer is available (not available in Expo Go or web preview)

// Conditionally import and register TrackPlayer service to prevent crashes in environments
// where native modules might not be linked (e.g., Expo Go preview, web).
let TrackPlayer: any = null;
let playbackService: any = null;

try {
  // Try to import TrackPlayer - will fail in Expo Go/web
  TrackPlayer = require('react-native-track-player').default;
  playbackService = require('./service').playbackService;
  
  if (TrackPlayer && typeof TrackPlayer.registerPlaybackService === 'function') {
    TrackPlayer.registerPlaybackService(() => playbackService);
    console.log('[index.ts] ✅ TrackPlayer playback service registered');
  } else {
    console.warn('[index.ts] ⚠️ TrackPlayer or registerPlaybackService is undefined. Background audio will not work in this preview environment. Please use a custom development client or a built APK/AAB to test background audio.');
  }
} catch (error) {
  console.warn('[index.ts] ⚠️ TrackPlayer native module not available. This is expected in Expo Go or web preview. Background audio will not work. Error:', error);
  console.log('[index.ts] ℹ️ To test background audio, build a custom development client or APK/AAB.');
}

import 'expo-router/entry';
