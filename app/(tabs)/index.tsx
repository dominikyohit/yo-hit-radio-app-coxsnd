
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { getZenoMetadata, ZenoMetadata } from '@/utils/zenoMetadata';
import { colors } from '@/styles/commonStyles';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const STREAM_URL = 'https://stream.zeno.fm/hmc38shnrwzuv';
const METADATA_POLL_INTERVAL = 10000;

export default function HomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState<ZenoMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const sound = useRef<Audio.Sound | null>(null);
  const metadataInterval = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
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
    metadataInterval.current = setInterval(fetchMetadata, METADATA_POLL_INTERVAL);
  }, [fetchMetadata]);

  const stopMetadataPolling = useCallback(() => {
    if (metadataInterval.current) {
      clearInterval(metadataInterval.current);
      metadataInterval.current = null;
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
    startMetadataPolling();

    return () => {
      stopMetadataPolling();
    };
  }, [fetchMetadata, startMetadataPolling, stopMetadataPolling]);

  useEffect(() => {
    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        if (sound.current) {
          await sound.current.stopAsync();
          await sound.current.unloadAsync();
          sound.current = null;
        }
        setIsPlaying(false);
      } else {
        setLoading(true);
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

        sound.current = newSound;
        setIsPlaying(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      setLoading(false);
      setIsPlaying(false);
    }
  };

  return (
    <LinearGradient colors={['#1a0033', '#330066', '#1a0033']} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section - Image-based logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/821e24d8-2a3e-485e-8842-32518269360d.png')}
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
            <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
            <Animated.View style={[styles.coverImageContainer, animatedStyle]}>
              {metadata?.cover_image ? (
                <Image
                  source={{ uri: metadata.cover_image }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderCover}>
                  <IconSymbol
                    ios_icon_name="music.note"
                    android_material_icon_name="music-note"
                    size={64}
                    color="#FFD700"
                  />
                </View>
              )}
            </Animated.View>
            <Text style={styles.songTitle} numberOfLines={2}>
              {metadata?.title || 'Yo Hit Radio'}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {metadata?.artist || 'Live Stream'}
            </Text>
          </View>

          {/* Listen Live Button */}
          <TouchableOpacity
            style={[styles.listenLiveButton, loading && styles.buttonDisabled]}
            onPress={togglePlayback}
            disabled={loading}
          >
            <IconSymbol
              ios_icon_name={isPlaying ? 'pause.circle.fill' : 'play.circle.fill'}
              android_material_icon_name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={24}
              color="#1a0033"
            />
            <Text style={styles.listenLiveText}>
              {loading ? 'Loading...' : isPlaying ? 'Stop' : 'Listen Live'}
            </Text>
          </TouchableOpacity>

          {/* Quick Links */}
          <View style={styles.quickLinksContainer}>
            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => router.push('/news')}
            >
              <IconSymbol
                ios_icon_name="newspaper.fill"
                android_material_icon_name="article"
                size={32}
                color="#FFD700"
              />
              <Text style={styles.quickLinkText}>News</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => router.push('/top10')}
            >
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar-chart"
                size={32}
                color="#FFD700"
              />
              <Text style={styles.quickLinkText}>Top 10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => router.push('/events')}
            >
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={32}
                color="#FFD700"
              />
              <Text style={styles.quickLinkText}>Events</Text>
            </TouchableOpacity>
          </View>
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
    marginRight: 6,
  },
  liveText: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  nowPlayingLabel: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 15,
  },
  coverImageContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  artistName: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
  },
  listenLiveButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 30,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  listenLiveText: {
    color: '#1a0033',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  quickLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickLinkCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  quickLinkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});
