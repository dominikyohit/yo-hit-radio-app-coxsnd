
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getZenoMetadata, ZenoMetadata } from '@/utils/zenoMetadata';

const STREAM_URL = 'https://stream.zeno.fm/hmc38shnrwzuv';
const METADATA_POLL_INTERVAL = 10000;
const LOGO_FALLBACK = require('@/assets/images/yo-hit-radio-logo.png');

export default function HomeScreen() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [metadata, setMetadata] = useState<ZenoMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const metadataIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rotation = useSharedValue(0);

  const fetchMetadata = useCallback(async () => {
    try {
      setIsLoadingMetadata(true);
      const data = await getZenoMetadata();
      setMetadata(data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  const startMetadataPolling = useCallback(() => {
    fetchMetadata();
    metadataIntervalRef.current = setInterval(fetchMetadata, METADATA_POLL_INTERVAL);
  }, [fetchMetadata]);

  const stopMetadataPolling = useCallback(() => {
    if (metadataIntervalRef.current) {
      clearInterval(metadataIntervalRef.current);
      metadataIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      stopMetadataPolling();
    };
  }, [sound, stopMetadataPolling]);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 3000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying, rotation]);

  useEffect(() => {
    if (isPlaying) {
      startMetadataPolling();
    } else {
      stopMetadataPolling();
    }
  }, [isPlaying, startMetadataPolling, stopMetadataPolling]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const togglePlayback = async () => {
    try {
      if (isPlaying && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      } else {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: STREAM_URL },
          { shouldPlay: true, isLooping: false },
          null,
          true
        );

        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/3678a9eb-6ee6-45aa-9ed2-a360712cc264.jpeg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(88,28,135,0.8)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoContainer}>
              <Image source={LOGO_FALLBACK} style={styles.logo} resizeMode="contain" />
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.nowPlayingCard}>
              <Animated.View style={[styles.coverImageContainer, animatedStyle]}>
                <Image
                  source={
                    metadata?.artworkUrl
                      ? { uri: metadata.artworkUrl }
                      : require('@/assets/images/yo-hit-radio-logo.png')
                  }
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              </Animated.View>
              <Text style={styles.nowPlayingTitle}>Now Playing</Text>
              <Text style={styles.songTitle} numberOfLines={2}>
                {metadata?.title || 'Yo Hit Radio'}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {metadata?.artist || 'Live Stream'}
              </Text>
              <View style={styles.liveStatusBadge}>
                <View style={styles.liveStatusDot} />
                <Text style={styles.liveStatusText}>ON AIR</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
              <LinearGradient
                colors={['#FCD34D', '#F59E0B', '#D97706']}
                style={styles.playButtonGradient}
              >
                <IconSymbol
                  name={isPlaying ? 'pause.circle.fill' : 'play.circle.fill'}
                  size={48}
                  color="#1F1B2E"
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.listenLiveButton} onPress={togglePlayback}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.listenLiveGradient}
              >
                <IconSymbol name="antenna.radiowaves.left.and.right" size={20} color="#FFF" />
                <Text style={styles.listenLiveText}>
                  {isPlaying ? 'Stop Listening' : 'Listen Live'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.shortcutsContainer}>
              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => router.push('/(tabs)/news')}
              >
                <View style={styles.shortcutIconContainer}>
                  <IconSymbol name="newspaper.fill" size={28} color="#FCD34D" />
                </View>
                <Text style={styles.shortcutTitle}>News</Text>
                <Text style={styles.shortcutSubtitle}>Latest updates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => router.push('/(tabs)/top10')}
              >
                <View style={styles.shortcutIconContainer}>
                  <IconSymbol name="chart.bar.fill" size={28} color="#FCD34D" />
                </View>
                <Text style={styles.shortcutTitle}>Top 10</Text>
                <Text style={styles.shortcutSubtitle}>Weekly chart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutCard}
                onPress={() => router.push('/(tabs)/events')}
              >
                <View style={styles.shortcutIconContainer}>
                  <IconSymbol name="calendar" size={28} color="#FCD34D" />
                </View>
                <Text style={styles.shortcutTitle}>Events</Text>
                <Text style={styles.shortcutSubtitle}>Upcoming shows</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 180,
    height: 60,
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  coverImageContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(252, 211, 77, 0.5)',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  nowPlayingTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 12,
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginRight: 6,
  },
  liveStatusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  playButton: {
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 60,
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  playButtonGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listenLiveButton: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  listenLiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  listenLiveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  shortcutsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shortcutIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  shortcutSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
