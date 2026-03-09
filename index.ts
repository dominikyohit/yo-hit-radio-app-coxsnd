
// Initialize Natively console log capture before anything else
import './utils/errorLogger';

// Register TrackPlayer playback service for background audio
import TrackPlayer from 'react-native-track-player';
import { playbackService } from './service';

TrackPlayer.registerPlaybackService(() => playbackService);

import 'expo-router/entry';
