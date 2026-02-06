
import 'expo-router/entry';
import TrackPlayer from 'react-native-track-player';

// Register the playback service for react-native-track-player
// This is required for background audio on Android
TrackPlayer.registerPlaybackService(() => require('./service'));
