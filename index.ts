
// Initialize Natively console log capture before anything else
import './utils/errorLogger';

// Register TrackPlayer playback service for background audio
// Only register if TrackPlayer is available (not available in Expo Go or web preview)
import TrackPlayer from 'react-native-track-player';
import { playbackService } from './service';

// Conditionally register TrackPlayer service to prevent crashes in environments
// where native modules might not be linked (e.g., Expo Go preview, web).
if (TrackPlayer && typeof TrackPlayer.registerPlaybackService === 'function') {
  TrackPlayer.registerPlaybackService(() => playbackService);
  console.log('[index.ts] ✅ TrackPlayer playback service registered');
} else {
  console.warn('[index.ts] ⚠️ TrackPlayer or registerPlaybackService is undefined. Background audio will not work in this preview environment. Please use a custom development client or a built APK/AAB to test background audio.');
}

import 'expo-router/entry';
