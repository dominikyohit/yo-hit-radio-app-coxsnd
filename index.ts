
// Initialize Natively console log capture before anything else
import './utils/errorLogger';

// CRITICAL: Register TrackPlayer playback service BEFORE Expo Router
// This ensures background audio works correctly on both Android and iOS
import TrackPlayer from 'react-native-track-player';
import { playbackService } from './service';

console.log('[App] 🎵 Registering TrackPlayer playback service');
TrackPlayer.registerPlaybackService(() => playbackService);
console.log('[App] ✅ TrackPlayer playback service registered');

// Standard Expo Router entry point
import 'expo-router/entry';
