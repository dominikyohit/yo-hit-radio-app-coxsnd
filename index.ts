
// Initialize Natively console log capture before anything else
import './utils/errorLogger';

// CRITICAL: Register TrackPlayer playback service BEFORE expo-router/entry
// This enables background playback with Android Foreground Service and iOS lock screen controls
import TrackPlayer from 'react-native-track-player';
import { playbackService } from './service';

console.log('[App] 🎵 Registering TrackPlayer playback service...');
TrackPlayer.registerPlaybackService(() => playbackService);
console.log('[App] ✅ TrackPlayer playback service registered');
console.log('[App] 🤖 Android: Foreground Service enabled');
console.log('[App] 🍎 iOS: Lock screen controls enabled');

// Start Expo Router
import 'expo-router/entry';
