
import { getZenoMetadata, ZenoMetadata } from '@/utils/zenoMetadata';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import audioManager from '@/utils/audioManager';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/IconSymbol';
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

export default function HomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState<ZenoMetadata | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const metadataIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const rotation = useSharedValue(0);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

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

  const fetchMetadata = useCallback(async () => {
    try {
      const data = await getZenoMetadata();
      setMetadata(data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
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
      stopMetadataPolling();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        await audioManager.stopCurrentAudio();
        soundRef.current = null;
        setIsPlaying(false);
        stopMetadataPolling();
      } else {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: STREAM_URL },
          { shouldPlay: false }
        );

        soundRef.current = sound;
        await audioManager.playAudio(sound, true);
        setIsPlaying(true);
        startMetadataPolling();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      setIsPlaying(false);
    }
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/yohitradio-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.nowPlayingCard}>
            <View style={styles.nowPlayingHeader}>
              <IconSymbol name="music.note" size={20} color={colors.accent} />
              <Text style={styles.nowPlayingLabel}>Now Playing</Text>
            </View>

            <View style={styles.coverImageContainer}>
              <Animated.View style={[styles.coverImageWrapper, rotationStyle]}>
                <Image
                  source={
                    metadata?.coverImage
                      ? { uri: metadata.coverImage }
                      : require('@/assets/images/placeholder-cover.png')
                  }
                  style={styles.coverImage}
                />
              </Animated.View>
            </View>

            <Text style={styles.songTitle} numberOfLines={2}>
              {metadata?.title || 'Yo Hit Radio'}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {metadata?.artist || 'Live Stream'}
            </Text>

            <TouchableOpacity style={styles.playButton} onPress={togglePlayback} activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.accent, '#D4AF37']}
                style={styles.playButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <IconSymbol name={isPlaying ? 'pause.fill' : 'play.fill'} size={40} color="#1A0A2E" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.listenLiveButton} onPress={togglePlayback} activeOpacity={0.9}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.listenLiveGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconSymbol name="antenna.radiowaves.left.and.right" size={24} color="#1A0A2E" />
              <Text style={styles.listenLiveText}>{isPlaying ? 'Stop Live Stream' : 'Listen Live'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.shortcutsContainer}>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/news')}
              activeOpacity={0.8}
            >
              <View style={styles.shortcutIconContainer}>
                <IconSymbol name="newspaper.fill" size={28} color={colors.accent} />
              </View>
              <Text style={styles.shortcutTitle}>News</Text>
              <Text style={styles.shortcutSubtitle}>Latest updates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/top10')}
              activeOpacity={0.8}
            >
              <View style={styles.shortcutIconContainer}>
                <IconSymbol name="chart.bar.fill" size={28} color={colors.accent} />
              </View>
              <Text style={styles.shortcutTitle}>Top 10</Text>
              <Text style={styles.shortcutSubtitle}>Weekly chart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/events')}
              activeOpacity={0.8}
            >
              <View style={styles.shortcutIconContainer}>
                <IconSymbol name="calendar" size={28} color={colors.accent} />
              </View>
              <Text style={styles.shortcutTitle}>Events</Text>
              <Text style={styles.shortcutSubtitle}>Upcoming shows</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  logoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  logo: { width: 200, height: 80, marginBottom: 12 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FF00' },
  liveText: { color: '#00FF00', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  nowPlayingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nowPlayingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  nowPlayingLabel: { color: colors.accent, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  coverImageContainer: { alignItems: 'center', marginBottom: 20 },
  coverImageWrapper: { width: 180, height: 180, borderRadius: 90, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  playButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenLiveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  listenLiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  listenLiveText: {
    color: '#1A0A2E',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shortcutsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  shortcutIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shortcutTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  shortcutSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    textAlign: 'center',
  },
});
