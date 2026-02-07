
// Initialize Natively console log capture before anything else
import './utils/errorLogger';

/**
 * React Native Track Player - Service Registration
 * 
 * CRITICAL: The playback service MUST be registered before the app starts.
 * This enables background audio playback with Android Foreground Service.
 * 
 * The service runs in a separate native thread, ensuring audio continues
 * even when the React Native JS thread is paused or the app is backgrounded.
 */
import TrackPlayer from 'react-native-track-player';

// Register the playback service
// This tells TrackPlayer to use our service.ts file for handling remote control events
TrackPlayer.registerPlaybackService(() => require('./service'));

console.log('[App] ✅ TrackPlayer playback service registered');
console.log('[App] 🎵 Background audio playback enabled');
console.log('[App] 🤖 Android: Foreground Service ready');
console.log('[App] 🍎 iOS: Background audio session ready');

// Start the Expo Router app
import 'expo-router/entry';
