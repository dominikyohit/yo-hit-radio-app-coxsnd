
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getZenoMetadata, ZenoMetadata } from '@/utils/zenoMetadata';
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

const STREAM_URL = 'https://stream.zeno.fm/hmc38shnrwzuv';
const METADATA_POLL_INTERVAL = 10000;
const LOGO_FALLBACK = require('@/assets/images/cb5c7722-e8b4-4739-ac47-c7375d4682f9.png');

// Global audio instance for cross-screen coordination
let globalSound: Audio.Sound | null = null;
let globalSoundType: 'stream' | 'song' | null = null;

export async function stopGlobalAudio() {
  if (globalSound) {
    try {
      await globalSound.stopAsync();
      await globalSound.unloadAsync();
    } catch (error) {
      console.log('Error stopping global audio:', error);
    }
    globalSound = null;
    globalSoundType = null;
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<ZenoMetadata | null>(null);
  const sound = useRef<Audio.Sound | null>(null);
  const metadataInterval = useRef<NodeJS.Timeout | null>(null);
  const rotation = useSharedValue(0);

  const fetchMetadata = async () => {
    try {
      const data = await getZenoMetadata();
      setMetadata(data);
    } catch (error) {
      console.log('Metadata fetch error:', error);
    }
  };

  const startMetadataPolling = () => {
    fetchMetadata();
    metadataInterval.current = setInterval(fetchMetadata, METADATA_POLL_INTERVAL);
  };

  const stopMetadataPolling = () => {
    if (metadataInterval.current) {
      clearInterval(metadataInterval.current);
      metadataInterval.current = null;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
      stopMetadataPolling();
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
      startMetadataPolling();
    } else {
      rotation.value = withTiming(0, { duration: 300 });
      stopMetadataPolling();
    }
  }, [isPlaying, rotation]);

  const togglePlayback = useCallback(async () => {
    try {
      setIsLoading(true);

      // Stop any other audio source first
      if (globalSound && globalSoundType === 'song') {
        await stopGlobalAudio();
      }

      if (sound.current) {
        const status = await sound.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.current.pauseAsync();
            setIsPlaying(false);
            globalSound = null;
            globalSoundType = null;
          } else {
            await sound.current.playAsync();
            setIsPlaying(true);
            globalSound = sound.current;
            globalSoundType = 'stream';
          }
        }
      } else {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: STREAM_URL },
          { shouldPlay: true, isLooping: false },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        );

        sound.current = newSound;
        globalSound = newSound;
        globalSoundType = 'stream';
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image source={LOGO_FALLBACK} style={styles.logo} resizeMode="contain" />
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          {/* Now Playing Card */}
          <View style={styles.nowPlayingCard}>
            <Animated.View style={[styles.coverImageContainer, animatedStyle]}>
              <Image
                source={
                  metadata?.artworkUrl
                    ? { uri: metadata.artworkUrl }
                    : LOGO_FALLBACK
                }
                style={styles.coverImage}
                resizeMode="cover"
              />
            </Animated.View>

            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={2}>
                {metadata?.streamTitle || 'Yo Hit Radio'}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {isPlaying ? 'Live Now' : 'Tap to Listen'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.playButton}
              onPress={togglePlayback}
              disabled={isLoading}
            >
              <IconSymbol
                name={isPlaying ? 'pause.circle.fill' : 'play.circle.fill'}
                size={72}
                color={colors.accent}
              />
            </TouchableOpacity>
          </View>

          {/* Shortcut Cards */}
          <View style={styles.shortcutsContainer}>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/news')}
            >
              <IconSymbol name="newspaper.fill" size={32} color={colors.accent} />
              <Text style={styles.shortcutTitle}>News</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/top10')}
            >
              <IconSymbol name="chart.bar.fill" size={32} color={colors.accent} />
              <Text style={styles.shortcutTitle}>Top 10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/events')}
            >
              <IconSymbol name="calendar" size={32} color={colors.accent} />
              <Text style={styles.shortcutTitle}>Events</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
    height: 180,
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  liveText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  coverImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  trackInfo: {
    marginBottom: 20,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  trackArtist: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  playButton: {
    alignSelf: 'center',
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
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
});
