
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import AudioManager from '@/utils/audioManager';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { fetchLiveMetadata, LiveMetadata } from '@/utils/metadataService';
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
import { useRouter } from 'expo-router';

interface Show {
  name: string;
  startTime: string;
  endTime: string;
}

type Schedule = {
  [key: string]: Show[];
};

const STREAM_URL = 'https://stream.zeno.fm/hmc38shnrwzuv';
const METADATA_POLL_INTERVAL = 10000;

const SCHEDULE: Schedule = {
  'Mon-Fri': [
    { name: 'Morning Vibes', startTime: '06:00', endTime: '10:00' },
    { name: 'Midday Mix', startTime: '10:00', endTime: '14:00' },
    { name: 'Afternoon Drive', startTime: '14:00', endTime: '18:00' },
    { name: 'Evening Hits', startTime: '18:00', endTime: '22:00' },
    { name: 'Night Grooves', startTime: '22:00', endTime: '02:00' },
    { name: 'Late Night Chill', startTime: '02:00', endTime: '06:00' },
  ],
  Saturday: [
    { name: 'Weekend Kickoff', startTime: '08:00', endTime: '12:00' },
    { name: 'Saturday Afternoon', startTime: '12:00', endTime: '16:00' },
    { name: 'Saturday Night Party', startTime: '16:00', endTime: '22:00' },
    { name: 'Late Night Mix', startTime: '22:00', endTime: '02:00' },
    { name: 'Early Morning Vibes', startTime: '02:00', endTime: '08:00' },
  ],
  Sunday: [
    { name: 'Sunday Morning Gospel', startTime: '07:00', endTime: '11:00' },
    { name: 'Sunday Brunch', startTime: '11:00', endTime: '15:00' },
    { name: 'Sunday Chill', startTime: '15:00', endTime: '20:00' },
    { name: 'Sunday Night Wind Down', startTime: '20:00', endTime: '00:00' },
    { name: 'Midnight to Morning', startTime: '00:00', endTime: '07:00' },
  ],
};

const getCurrentAndNextShows = (): { current: Show | null; next: Show | null } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  let scheduleKey: string;
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    scheduleKey = 'Mon-Fri';
  } else if (dayOfWeek === 6) {
    scheduleKey = 'Saturday';
  } else {
    scheduleKey = 'Sunday';
  }

  const todaySchedule = SCHEDULE[scheduleKey];

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  let currentShow: Show | null = null;
  let nextShow: Show | null = null;

  for (let i = 0; i < todaySchedule.length; i++) {
    const show = todaySchedule[i];
    const startMinutes = timeToMinutes(show.startTime);
    let endMinutes = timeToMinutes(show.endTime);

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    let adjustedCurrentTime = currentTime;
    if (currentTime < startMinutes && endMinutes > 24 * 60) {
      adjustedCurrentTime += 24 * 60;
    }

    if (adjustedCurrentTime >= startMinutes && adjustedCurrentTime < endMinutes) {
      currentShow = show;
      if (i + 1 < todaySchedule.length) {
        nextShow = todaySchedule[i + 1];
      } else {
        const nextDayKey =
          scheduleKey === 'Mon-Fri'
            ? 'Saturday'
            : scheduleKey === 'Saturday'
            ? 'Sunday'
            : 'Mon-Fri';
        nextShow = SCHEDULE[nextDayKey][0];
      }
      break;
    }
  }

  if (!currentShow) {
    nextShow = todaySchedule[0];
  }

  return { current: currentShow, next: nextShow };
};

const HomeScreen = () => {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState<LiveMetadata>({
    artist: '',
    title: '',
    coverImage: null,
  });
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [nextShow, setNextShow] = useState<Show | null>(null);

  const metadataIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

  const startMetadataPolling = useCallback(() => {
    const poll = async () => {
      const data = await fetchLiveMetadata();
      setMetadata(data);
    };

    poll();
    metadataIntervalRef.current = setInterval(poll, METADATA_POLL_INTERVAL);
  }, []);

  const stopMetadataPolling = useCallback(() => {
    if (metadataIntervalRef.current) {
      clearInterval(metadataIntervalRef.current);
      metadataIntervalRef.current = null;
    }
  }, []);

  const updateShows = useCallback(() => {
    const { current, next } = getCurrentAndNextShows();
    setCurrentShow(current);
    setNextShow(next);
  }, []);

  useEffect(() => {
    updateShows();
    const interval = setInterval(updateShows, 60000);

    const checkPlayingStatus = async () => {
      const playing = await AudioManager.isPlaying();
      setIsPlaying(playing);
      if (playing) {
        startMetadataPolling();
      }
    };

    checkPlayingStatus();

    return () => {
      clearInterval(interval);
      stopMetadataPolling();
    };
  }, [startMetadataPolling, stopMetadataPolling, updateShows]);

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        await AudioManager.pause();
        setIsPlaying(false);
        stopMetadataPolling();
      } else {
        await AudioManager.playLiveStream(STREAM_URL);
        setIsPlaying(true);
        startMetadataPolling();
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.nowPlayingCard}>
            <TouchableOpacity onPress={togglePlayback} activeOpacity={0.8}>
              <View style={styles.circularPlayer}>
                <Image
                  source={
                    metadata.coverImage
                      ? { uri: metadata.coverImage }
                      : require('@/assets/images/54408113-904e-4ecd-a250-cf3f30403728.jpeg')
                  }
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                <Animated.View style={[styles.playButtonOverlay, animatedStyle]}>
                  <View style={styles.playButton}>
                    <IconSymbol name={isPlaying ? 'pause.fill' : 'play.fill'} size={40} color="#FFD700" />
                  </View>
                </Animated.View>
              </View>
            </TouchableOpacity>

            <Text style={styles.stationName}>Les meilleurs hits haïtiens 24/7</Text>
            <Text style={styles.liveStatus}>En direct</Text>

            {metadata.artist && metadata.title && (
              <View style={styles.metadataContainer}>
                <Text style={styles.metadataArtist} numberOfLines={1}>
                  {metadata.artist}
                </Text>
                <Text style={styles.metadataTitle} numberOfLines={1}>
                  {metadata.title}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.listenLiveButton} onPress={togglePlayback} activeOpacity={0.9}>
            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.listenLiveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <IconSymbol name="antenna.radiowaves.left.and.right" size={24} color="#1A0033" />
              <Text style={styles.listenLiveText}>{isPlaying ? 'En écoute' : 'Écouter en direct'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.showsContainer}>
            {currentShow && (
              <View style={styles.showCard}>
                <Text style={styles.showLabel}>Émission en cours</Text>
                <Text style={styles.showName}>{currentShow.name}</Text>
                <Text style={styles.showTime}>
                  {currentShow.startTime} - {currentShow.endTime}
                </Text>
              </View>
            )}

            {nextShow && (
              <View style={styles.showCard}>
                <Text style={styles.showLabel}>Prochaine émission</Text>
                <Text style={styles.showName}>{nextShow.name}</Text>
                <Text style={styles.showTime}>
                  {nextShow.startTime} - {nextShow.endTime}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gradientStart,
  },
  container: {
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
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
    marginRight: 6,
  },
  liveText: {
    color: '#FF0000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  circularPlayer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  playButtonOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 0, 51, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  liveStatus: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 10,
  },
  metadataContainer: {
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  metadataArtist: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  metadataTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  listenLiveButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A0033',
    marginLeft: 10,
  },
  showsContainer: {
    gap: 15,
  },
  showCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  showLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  showName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  showTime: {
    fontSize: 14,
    color: '#FFD700',
  },
});

export default HomeScreen;
