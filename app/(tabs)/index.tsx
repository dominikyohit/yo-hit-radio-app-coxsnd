
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
import { colors } from '@/styles/commonStyles';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import AudioManager from '@/utils/audioManager';
import { fetchLiveMetadata, LiveMetadata } from '@/utils/metadataService';

const STREAM_URL = 'https://stream.zeno.fm/hmc38shnrwzuv';
const METADATA_POLL_INTERVAL = 12000; // 12 seconds

interface Show {
  name: string;
  startTime: string;
  endTime: string;
}

interface Schedule {
  [day: string]: Show[];
}

// Schedule data matching the Shows tab
const SCHEDULE: Schedule = {
  Monday: [
    { name: 'Hit by Night', startTime: '00:00', endTime: '04:00' },
    { name: 'Gospel Hits', startTime: '04:00', endTime: '06:00' },
    { name: 'Morning Jam', startTime: '06:00', endTime: '09:00' },
    { name: 'The Playlist Hits', startTime: '09:00', endTime: '14:00' },
    { name: 'NextGen Vibes', startTime: '14:00', endTime: '16:00' },
    { name: 'Hit Sou Hit', startTime: '16:00', endTime: '20:00' },
    { name: 'Dominik Show', startTime: '20:00', endTime: '22:00' },
    { name: 'Hit Sou Hit', startTime: '22:00', endTime: '24:00' },
  ],
  Tuesday: [
    { name: 'Hit by Night', startTime: '00:00', endTime: '04:00' },
    { name: 'Gospel Hits', startTime: '04:00', endTime: '06:00' },
    { name: 'Morning Jam', startTime: '06:00', endTime: '09:00' },
    { name: 'The Playlist Hits', startTime: '09:00', endTime: '14:00' },
    { name: 'NextGen Vibes', startTime: '14:00', endTime: '16:00' },
    { name: 'Hit Sou Hit', startTime: '16:00', endTime: '20:00' },
    { name: 'Dominik Show', startTime: '20:00', endTime: '22:00' },
    { name: 'Hit Sou Hit', startTime: '22:00', endTime: '24:00' },
  ],
  Wednesday: [
    { name: 'Hit by Night', startTime: '00:00', endTime: '04:00' },
    { name: 'Gospel Hits', startTime: '04:00', endTime: '06:00' },
    { name: 'Morning Jam', startTime: '06:00', endTime: '09:00' },
    { name: 'The Playlist Hits', startTime: '09:00', endTime: '14:00' },
    { name: 'NextGen Vibes', startTime: '14:00', endTime: '16:00' },
    { name: 'Hit Sou Hit', startTime: '16:00', endTime: '20:00' },
    { name: 'Dominik Show', startTime: '20:00', endTime: '22:00' },
    { name: 'Hit Sou Hit', startTime: '22:00', endTime: '24:00' },
  ],
  Thursday: [
    { name: 'Hit by Night', startTime: '00:00', endTime: '04:00' },
    { name: 'Gospel Hits', startTime: '04:00', endTime: '06:00' },
    { name: 'Morning Jam', startTime: '06:00', endTime: '09:00' },
    { name: 'The Playlist Hits', startTime: '09:00', endTime: '14:00' },
    { name: 'NextGen Vibes', startTime: '14:00', endTime: '16:00' },
    { name: 'Hit Sou Hit', startTime: '16:00', endTime: '20:00' },
    { name: 'Dominik Show', startTime: '20:00', endTime: '22:00' },
    { name: 'Hit Sou Hit', startTime: '22:00', endTime: '24:00' },
  ],
  Friday: [
    { name: 'Hit by Night', startTime: '00:00', endTime: '04:00' },
    { name: 'Gospel Hits', startTime: '04:00', endTime: '06:00' },
    { name: 'Morning Jam', startTime: '06:00', endTime: '09:00' },
    { name: 'The Playlist Hits', startTime: '09:00', endTime: '14:00' },
    { name: 'NextGen Vibes', startTime: '14:00', endTime: '16:00' },
    { name: 'Hit Sou Hit', startTime: '16:00', endTime: '20:00' },
    { name: 'Dominik Show', startTime: '20:00', endTime: '22:00' },
    { name: 'Hit Sou Hit', startTime: '22:00', endTime: '24:00' },
  ],
  Saturday: [
    { name: 'Hit by Night', startTime: '00:00', endTime: '04:00' },
    { name: 'Gospel Hits', startTime: '04:00', endTime: '07:00' },
    { name: 'Morning Jam', startTime: '07:00', endTime: '09:00' },
    { name: 'Hit Sou Hit', startTime: '09:00', endTime: '19:00' },
    { name: 'Saturday Night Fever', startTime: '19:00', endTime: '24:00' },
  ],
  Sunday: [
    { name: 'Hit by Night', startTime: '00:00', endTime: '04:00' },
    { name: 'Gospel Hits', startTime: '04:00', endTime: '07:00' },
    { name: 'Morning Jam', startTime: '07:00', endTime: '09:00' },
    { name: 'Hit Sou Hit', startTime: '09:00', endTime: '17:00' },
    { name: 'Retro Hits', startTime: '17:00', endTime: '24:00' },
  ],
};

// Function to get current and next shows
const getCurrentAndNextShows = (): { currentShow: Show | null; nextShow: Show | null } => {
  const now = new Date();
  const dayIndex = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[dayIndex];
  const todaysSchedule = SCHEDULE[today];

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  let currentShow: Show | null = null;
  let nextShow: Show | null = null;

  if (todaysSchedule) {
    for (let i = 0; i < todaysSchedule.length; i++) {
      const show = todaysSchedule[i];
      const [startHour, startMinute] = show.startTime.split(':').map(Number);
      const [endHour, endMinute] = show.endTime.split(':').map(Number);

      const startTimeInMinutes = startHour * 60 + startMinute;
      let endTimeInMinutes = endHour * 60 + endMinute;

      // Handle midnight (24:00 = 00:00 next day)
      if (endTimeInMinutes === 0) {
        endTimeInMinutes = 24 * 60;
      }

      // Check if current time is within this show's time range
      if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
        currentShow = show;
      } else if (currentTimeInMinutes < startTimeInMinutes && nextShow === null) {
        // This is the next show today
        nextShow = show;
      }
    }
  }

  // If no next show found today, get the first show of the next day
  if (!nextShow) {
    let nextDayIndex = (dayIndex + 1) % 7;
    let nextDay = days[nextDayIndex];
    let nextDaySchedule = SCHEDULE[nextDay];

    if (nextDaySchedule && nextDaySchedule.length > 0) {
      nextShow = nextDaySchedule[0];
    }
  }

  return { currentShow, nextShow };
};

export default function HomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState<LiveMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [nextShow, setNextShow] = useState<Show | null>(null);
  const metadataInterval = useRef<NodeJS.Timeout | null>(null);
  const showUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const rotation = useSharedValue(0);
  const audioManager = AudioManager.getInstance();

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
    console.log('[Home] Fetching metadata... (isPlaying:', isPlaying, ')');
    try {
      const data = await fetchLiveMetadata();
      console.log('[Home] Fetched metadata:', data);
      setMetadata(data);
    } catch (error) {
      console.error('[Home] Error fetching metadata:', error);
    }
  }, [isPlaying]);

  const updateShows = useCallback(() => {
    const { currentShow: current, nextShow: next } = getCurrentAndNextShows();
    console.log('[Home] Updated shows - Current:', current?.name, 'Next:', next?.name);
    setCurrentShow(current);
    setNextShow(next);
  }, []);

  const startMetadataPolling = useCallback(() => {
    console.log('[Home] Starting metadata polling');
    fetchMetadata();
  }, [fetchMetadata]);

  const stopMetadataPolling = useCallback(() => {
    console.log('[Home] Stopping metadata polling');
    if (metadataInterval.current) {
      clearInterval(metadataInterval.current);
      metadataInterval.current = null;
    }
    setMetadata(null);
  }, []);

  useEffect(() => {
    console.log('[Home] isPlaying changed to:', isPlaying);
    
    if (isPlaying) {
      startMetadataPolling();
      metadataInterval.current = setInterval(fetchMetadata, METADATA_POLL_INTERVAL);
    } else {
      stopMetadataPolling();
    }

    updateShows();
    showUpdateInterval.current = setInterval(updateShows, 60000);

    return () => {
      stopMetadataPolling();
      if (showUpdateInterval.current) {
        clearInterval(showUpdateInterval.current);
      }
    };
  }, [isPlaying, startMetadataPolling, stopMetadataPolling, updateShows, fetchMetadata]);

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        console.log('[Home] User tapped Stop button');
        await audioManager.stopCurrentAudio();
        setIsPlaying(false);
      } else {
        console.log('[Home] User tapped Listen Live button');
        setLoading(true);
        
        const title = metadata?.title || 'Yo Hit Radio – Live Stream';
        const artist = metadata?.artist || 'Live Stream';
        
        await audioManager.playAudio(STREAM_URL, true, title, artist);
        setIsPlaying(true);
        setLoading(false);
        console.log('[Home] Live stream started successfully with background playback enabled');
      }
    } catch (error) {
      console.error('[Home] Error toggling playback:', error);
      setLoading(false);
      setIsPlaying(false);
    }
  };

  // Parse metadata with proper fallbacks
  const displayTitle = metadata?.title && metadata.title.trim() !== '' 
    ? metadata.title 
    : 'Live Stream';
  const displayArtist = metadata?.artist && metadata.artist.trim() !== '' 
    ? metadata.artist 
    : 'Yo Hit Radio';
  const displayArtwork = metadata?.artwork;
  
  // 🚨 DEBUG: Prepare metadata JSON string for display
  const metadataDebugString = JSON.stringify(metadata);

  return (
    <LinearGradient colors={['#1a0033', '#330066', '#1a0033']} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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

          <View style={styles.nowPlayingCard}>
            <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
            {displayArtwork ? (
              <Animated.View style={[styles.coverImageContainer, animatedStyle]}>
                <Image source={{ uri: displayArtwork }} style={styles.coverImage} />
              </Animated.View>
            ) : (
              <Animated.View style={[styles.coverImageContainer, animatedStyle]}>
                <View style={styles.placeholderCover}>
                  <IconSymbol
                    ios_icon_name="music.note"
                    android_material_icon_name="music-note"
                    size={64}
                    color="#FFD700"
                  />
                </View>
              </Animated.View>
            )}
            <Text style={styles.songTitle} numberOfLines={2}>
              {displayTitle}
            </Text>
            <Text style={styles.artistName} numberOfLines={2}>
              {displayArtist}
            </Text>
            
            <Text style={styles.debugText}>
              DEBUG: {metadataDebugString}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.listenLiveButton, loading && styles.buttonDisabled]}
            onPress={togglePlayback}
            disabled={loading}
          >
            <IconSymbol
              ios_icon_name={isPlaying ? 'pause.circle.fill' : 'play.circle.fill'}
              android_material_icon_name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
              size={24}
              color="#1a0033"
            />
            <Text style={styles.listenLiveText}>
              {loading ? 'Loading...' : isPlaying ? 'Stop' : 'Listen Live'}
            </Text>
          </TouchableOpacity>

          <View style={styles.showCardsContainer}>
            <View style={styles.showCard}>
              <View style={styles.showCardHeader}>
                <IconSymbol
                  ios_icon_name="radio"
                  android_material_icon_name="radio"
                  size={20}
                  color="#FFD700"
                />
                <Text style={styles.showCardLabel}>CURRENT SHOW</Text>
              </View>
              {currentShow ? (
                <React.Fragment>
                  <Text style={styles.showName} numberOfLines={2}>
                    {currentShow.name}
                  </Text>
                  <View style={styles.showTimeContainer}>
                    <IconSymbol
                      ios_icon_name="clock"
                      android_material_icon_name="access-time"
                      size={14}
                      color="#B8B8B8"
                    />
                    <Text style={styles.showTime}>
                      {currentShow.startTime}–{currentShow.endTime}
                    </Text>
                  </View>
                </React.Fragment>
              ) : (
                <Text style={styles.noShowText}>No show scheduled</Text>
              )}
            </View>

            <View style={styles.showCard}>
              <View style={styles.showCardHeader}>
                <IconSymbol
                  ios_icon_name="clock.arrow.circlepath"
                  android_material_icon_name="schedule"
                  size={20}
                  color="#FFD700"
                />
                <Text style={styles.showCardLabel}>NEXT SHOW</Text>
              </View>
              {nextShow ? (
                <React.Fragment>
                  <Text style={styles.showName} numberOfLines={2}>
                    {nextShow.name}
                  </Text>
                  <View style={styles.showTimeContainer}>
                    <IconSymbol
                      ios_icon_name="clock"
                      android_material_icon_name="access-time"
                      size={14}
                      color="#B8B8B8"
                    />
                    <Text style={styles.showTime}>
                      {nextShow.startTime}–{nextShow.endTime}
                    </Text>
                  </View>
                </React.Fragment>
              ) : (
                <Text style={styles.noShowText}>No show scheduled</Text>
              )}
            </View>
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
    marginBottom: 10,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
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
  showCardsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  showCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    minHeight: 120,
  },
  showCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  showCardLabel: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  showName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 20,
  },
  showTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  showTime: {
    color: '#B8B8B8',
    fontSize: 13,
    fontWeight: '600',
  },
  noShowText: {
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
