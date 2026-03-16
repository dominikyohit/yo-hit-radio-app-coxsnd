
// Initialize Natively console log capture before anything else
import './utils/errorLogger';

// Register TrackPlayer playback service BEFORE expo-router
import TrackPlayer from 'react-native-track-player';
TrackPlayer.registerPlaybackService(() => require('./service'));

import 'expo-router/entry';
