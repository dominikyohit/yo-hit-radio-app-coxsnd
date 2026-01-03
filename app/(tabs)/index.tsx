
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { getZenoMetadata, ZenoMetadata } from '@/utils/zenoMetadata';

const { width } = Dimensions.get('window');
const STREAM_URL = 'https://stream.zeno.fm/hmc38shnrwzuv';
const METADATA_POLL_INTERVAL = 10000; // Poll every 10 seconds
const LOGO_FALLBACK = 'https://prod-finalquest-user-projects-storage-bucket-aws.s3.amazonaws.com/user-projects/ee56f6a2-c621-44e1-862b-ddbf7d8dce99/assets/images/14c4a560-f518-4dca-a82d-8b2977bf3151.jpeg?AWSAccessKeyId=AKIAVRUVRKQJC5DISQ4Q&Signature=H%2FNEhs3zjnqZmCe9uI37GWADHBc%3D&Expires=1767494669';

export default function HomeScreen() {
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Metadata state
  const [trackTitle, setTrackTitle] = useState('Yo Hit Radio');
  const [artistName, setArtistName] = useState('Live Stream');
  const [artworkUrl, setArtworkUrl] = useState<string | undefined>(undefined);
  
  const rotation = useSharedValue(0);
  const metadataIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animated rotation for the play button
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  // Metadata fetching function - memoized with useCallback
  const fetchMetadata = useCallback(async () => {
    try {
      console.log('[Home] ----------------------------------------');
      console.log('[Home] Fetching metadata at:', new Date().toISOString());
      
      const metadata: ZenoMetadata = await getZenoMetadata();
      
      console.log('[Home] Metadata received:', {
        title: metadata.title,
        artist: metadata.artist,
        hasArtwork: !!metadata.artworkUrl,
      });

      // Update UI state
      setTrackTitle(metadata.title);
      setArtistName(metadata.artist);
      setArtworkUrl(metadata.artworkUrl);
      
      console.log('[Home] UI updated with new metadata');
      console.log('[Home] ----------------------------------------');
    } catch (error) {
      console.error('[Home] ❌ Metadata fetch error:', error);
      console.log('[Home] Keeping existing values');
      console.log('[Home] ----------------------------------------');
    }
  }, []);

  // Start metadata polling - memoized with useCallback
  const startMetadataPolling = useCallback(() => {
    console.log('[Home] Starting metadata polling');
    console.log('[Home] Poll interval:', METADATA_POLL_INTERVAL / 1000, 'seconds');
    
    // Clear any existing interval
    if (metadataIntervalRef.current) {
      console.log('[Home] Clearing existing polling interval');
      clearInterval(metadataIntervalRef.current);
    }

    // Poll metadata at regular intervals
    metadataIntervalRef.current = setInterval(() => {
      console.log('[Home] 🔄 Polling metadata (interval tick)');
      fetchMetadata();
    }, METADATA_POLL_INTERVAL);
    
    console.log('[Home] Metadata polling started successfully');
  }, [fetchMetadata]);

  // Stop metadata polling - memoized with useCallback
  const stopMetadataPolling = useCallback(() => {
    console.log('[Home] Stopping metadata polling');
    if (metadataIntervalRef.current) {
      clearInterval(metadataIntervalRef.current);
      metadataIntervalRef.current = null;
      console.log('[Home] Metadata polling stopped');
    }
  }, []);

  // Configure audio on mount
  useEffect(() => {
    console.log('[Home] ========================================');
    console.log('[Home] Component mounted - initializing');
    console.log('[Home] Stream URL:', STREAM_URL);
    console.log('[Home] Metadata poll interval:', METADATA_POLL_INTERVAL, 'ms');
    
    // Configure audio mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    }).then(() => {
      console.log('[Home] Audio mode configured successfully');
    }).catch((error) => {
      console.error('[Home] Error configuring audio mode:', error);
    });

    // Fetch initial metadata immediately
    console.log('[Home] Fetching initial metadata...');
    fetchMetadata();
    
    // Start polling metadata
    startMetadataPolling();

    return () => {
      console.log('[Home] Component unmounting - cleaning up');
      stopMetadataPolling();
      console.log('[Home] ========================================');
    };
  }, [fetchMetadata, startMetadataPolling, stopMetadataPolling]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        console.log('[Home] Unloading audio on unmount...');
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Handle play button animation
  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying, rotation]);

  const togglePlayback = async () => {
    try {
      console.log('[Home] ========================================');
      console.log('[Home] Toggle playback - current state:', isPlaying ? 'PLAYING' : 'STOPPED');
      
      if (sound) {
        if (isPlaying) {
          console.log('[Home] Pausing audio...');
          await sound.pauseAsync();
          setIsPlaying(false);
          console.log('[Home] Audio paused');
        } else {
          console.log('[Home] Resuming audio...');
          await sound.playAsync();
          setIsPlaying(true);
          console.log('[Home] Audio resumed');
        }
      } else {
        console.log('[Home] Creating new audio instance...');
        console.log('[Home] Stream URL:', STREAM_URL);
        setIsLoading(true);
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: STREAM_URL },
          { shouldPlay: true }
        );
        
        console.log('[Home] Audio instance created successfully');
        setSound(newSound);
        setIsPlaying(true);
        setIsLoading(false);
        console.log('[Home] Audio started playing');
      }
      
      console.log('[Home] ========================================');
    } catch (error) {
      console.error('[Home] ❌ Error toggling playback:', error);
      setIsLoading(false);
      console.log('[Home] ========================================');
    }
  };

  const shortcuts = [
    { title: 'News', icon: 'article', route: '/(tabs)/news' },
    { title: 'Top 10', icon: 'music-note', route: '/(tabs)/top10' },
    { title: 'Events', icon: 'event', route: '/(tabs)/events' },
  ];

  return (
    <LinearGradient
      colors={[colors.background, colors.card, colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={{ uri: LOGO_FALLBACK }}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          {/* Now Playing Card */}
          <View style={styles.nowPlayingCard}>
            <View style={styles.cardHeader}>
              <IconSymbol
                ios_icon_name="radio"
                android_material_icon_name="radio"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.cardTitle}>Now Playing</Text>
            </View>
            
            <View style={styles.nowPlayingContent}>
              {/* Album artwork or fallback icon */}
              {artworkUrl ? (
                <Image
                  source={{ uri: artworkUrl }}
                  style={styles.coverImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('[Home] Artwork failed to load:', error.nativeEvent.error);
                    setArtworkUrl(undefined);
                  }}
                />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <IconSymbol
                    ios_icon_name="music.note"
                    android_material_icon_name="music-note"
                    size={48}
                    color={colors.accent}
                  />
                </View>
              )}
              
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle} numberOfLines={2}>
                  {trackTitle}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {artistName}
                </Text>
                <View style={styles.liveStatusBadge}>
                  <View style={styles.liveStatusDot} />
                  <Text style={styles.liveStatusText}>ON AIR</Text>
                </View>
              </View>
            </View>

            {/* Large Circular Play/Pause Button */}
            <View style={styles.playButtonContainer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayback}
                disabled={isLoading}
              >
                <Animated.View style={[styles.playButtonInner, animatedStyle]}>
                  <LinearGradient
                    colors={[colors.accent, colors.highlight]}
                    style={styles.playButtonGradient}
                  >
                    {isLoading ? (
                      <IconSymbol
                        ios_icon_name="hourglass"
                        android_material_icon_name="hourglass-empty"
                        size={48}
                        color={colors.background}
                      />
                    ) : (
                      <IconSymbol
                        ios_icon_name={isPlaying ? 'pause.fill' : 'play.fill'}
                        android_material_icon_name={isPlaying ? 'pause' : 'play-arrow'}
                        size={48}
                        color={colors.background}
                      />
                    )}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Listen Live Button */}
            <TouchableOpacity
              style={styles.listenLiveButton}
              onPress={togglePlayback}
              disabled={isLoading}
            >
              <Text style={styles.listenLiveText}>
                {isPlaying ? 'Listening Live' : 'Listen Live'}
              </Text>
              <IconSymbol
                ios_icon_name="antenna.radiowaves.left.and.right"
                android_material_icon_name="radio"
                size={20}
                color={colors.background}
              />
            </TouchableOpacity>
          </View>

          {/* Shortcut Cards */}
          <View style={styles.shortcutsSection}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.shortcutsGrid}>
              {shortcuts.map((shortcut, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.shortcutCard}
                  onPress={() => router.push(shortcut.route as any)}
                >
                  <View style={styles.shortcutIconContainer}>
                    <IconSymbol
                      ios_icon_name={shortcut.icon}
                      android_material_icon_name={shortcut.icon}
                      size={32}
                      color={colors.accent}
                    />
                  </View>
                  <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Debug Info (only visible in development) */}
          {__DEV__ && (
            <View style={styles.debugSection}>
              <Text style={styles.debugTitle}>Debug Info</Text>
              <Text style={styles.debugText}>Stream: {STREAM_URL}</Text>
              <Text style={styles.debugText}>Title: {trackTitle}</Text>
              <Text style={styles.debugText}>Artist: {artistName}</Text>
              <Text style={styles.debugText}>Artwork: {artworkUrl ? 'Yes' : 'No'}</Text>
              <Text style={styles.debugText}>Playing: {isPlaying ? 'Yes' : 'No'}</Text>
              <Text style={styles.debugText}>Poll Interval: {METADATA_POLL_INTERVAL / 1000}s</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 20,
    marginBottom: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  liveText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(45, 27, 78, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.4)',
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  nowPlayingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  coverPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 70, 193, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  coverImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: 'rgba(107, 70, 193, 0.3)',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  trackArtist: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 6,
  },
  liveStatusText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  playButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    boxShadow: '0px 8px 24px rgba(251, 191, 36, 0.4)',
    elevation: 8,
  },
  playButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  playButtonGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    boxShadow: '0px 4px 12px rgba(251, 191, 36, 0.3)',
    elevation: 4,
  },
  listenLiveText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
    marginRight: 8,
  },
  shortcutsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: 'rgba(45, 27, 78, 0.6)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  shortcutIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(107, 70, 193, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  debugSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 12,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
