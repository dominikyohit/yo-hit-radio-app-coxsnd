import { OptimizedImage } from '@/components/OptimizedImage';
import { saveMetadataCache, loadMetadataCache } from '@/utils/metadataCache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { audioManager } from '@/utils/audioManager'; // Use the expo-av based audioManager
import { colors } from '@/styles/commonStyles';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseEventDate, formatDateBadge } from '@/utils/dateHelpers';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  ImageSourcePropType,
  Modal,
} from 'react-native';
import { fetchWithTimeout, isNetworkError } from '@/utils/networkHelpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';
import { Audio } from 'expo-av'; // Import Audio for PlaybackStatus type

interface Show {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  imageUrl: string | null;
}

type Schedule = {
  [key: string]: Show[];
};

interface AzuraCastMetadata {
  displayTitle: string;
  displayArtist: string;
  coverImage: string | null;
}

interface WordPressEvent {
  id: number;
  title: { rendered: string };
  acf: {
    event_date: string;
    event_location: string;
    event_price: string;
    event_artists: string;
    ticket_link: string;
  };
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url?: string;
    }[];
  };
}

interface PreviewEvent {
  id: string;
  title: string;
  event_date_raw: string;
  event_date: Date | null;
  event_location: string;
  flyer_image: string | null;
}

interface WordPressPost {
  id: number;
  title: { rendered: string };
  date: string;
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url?: string;
    }[];
  };
}

interface PreviewArticle {
  id: string;
  title: string;
  published_date: string;
  featured_image_url: string | null;
}

interface WordPressSong {
  id: number;
  title: { rendered: string };
  date: string;
  acf: {
    artist_name: string;
    release_date: string;
  };
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url?: string;
    }[];
  };
}

interface PreviewRelease {
  id: number;
  title: string;
  artist: string;
  coverImage: string | null;
  releaseDate: string;
}

interface WordPressScheduleItem {
  id: number;
  title: { rendered: string };
  acf?: {
    day?: string;
    start_time?: string;
    end_time?: string;
    show_title?: string;
    sort_order?: number;
  };
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url?: string;
    }[];
  };
}

const STREAM_URL = 'https://stream.zeno.fm/hmc38shnrwzuv';
const METADATA_POLL_INTERVAL = 10000; // Poll every 10 seconds
const AZURACAST_API_URL = 'https://public.cdn.yohitradio.com/api/nowplaying_static/yohitradio.json';
const WORDPRESS_SCHEDULE_URL = 'https://yohitradio.com/wp-json/wp/v2/schedule?_embed';
const BACKGROUND_INFO_SHOWN_KEY = 'backgroundInfoShown';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    paddingBottom: 100, // Space for the floating tab bar
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  nowPlayingCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  nowPlayingGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  textContainer: {
    flex: 1,
  },
  nowPlayingTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  nowPlayingArtist: {
    color: colors.white,
    fontSize: 16,
    marginTop: 5,
  },
  liveStatus: {
    color: colors.lightGray,
    fontSize: 14,
    marginTop: 5,
  },
  playButtonContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  },
  playIcon: {
    color: colors.darkPurple,
    fontSize: 50,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  shortcutCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginHorizontal: 10,
  },
  shortcutCard: {
    width: (width - 60) / 2, // Two cards per row with spacing
    aspectRatio: 1, // Make it square
    borderRadius: 15,
    margin: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  shortcutIcon: {
    fontSize: 40,
    color: colors.gold,
    marginBottom: 10,
  },
  shortcutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  previewCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewGradient: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  previewTextContainer: {
    flex: 1,
  },
  previewTitle: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewSubtitle: {
    color: colors.white,
    fontSize: 14,
    marginTop: 3,
  },
  previewDate: {
    color: colors.lightGray,
    fontSize: 12,
    marginTop: 3,
  },
  liveButton: {
    backgroundColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    alignSelf: 'center',
  },
  liveButtonText: {
    color: colors.darkPurple,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: colors.darkPurple,
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: colors.gold,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    minWidth: 150,
  },
  modalButtonText: {
    color: colors.darkPurple,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  currentShowText: {
    color: colors.white,
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  nextShowText: {
    color: colors.lightGray,
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
});

const getCurrentAndNextShows = (schedule: Schedule) => {
  const now = new Date();
  const currentDay = now.toLocaleString('en-US', { weekday: 'long' });
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

  const todaySchedule = schedule[currentDay] || [];

  let currentShow: Show | null = null;
  let nextShow: Show | null = null;

  for (let i = 0; i < todaySchedule.length; i++) {
    const show = todaySchedule[i];
    const [startHour, startMinute] = show.startTime.split(':').map(Number);
    const [endHour, endMinute] = show.endTime.split(':').map(Number);

    const showStartTime = startHour * 60 + startMinute;
    const showEndTime = endHour * 60 + endMinute;

    if (currentTime >= showStartTime && currentTime < showEndTime) {
      currentShow = show;
      if (i + 1 < todaySchedule.length) {
        nextShow = todaySchedule[i + 1];
      }
      break;
    } else if (currentTime < showStartTime) {
      nextShow = show;
      break;
    }
  }

  return { currentShow, nextShow };
};

const resolveImageSource = (source: string | number | ImageSourcePropType | undefined): ImageSourcePropType => {
  if (typeof source === 'string') {
    return { uri: source };
  }
  return source as ImageSourcePropType;
};

const HomeScreen = () => {
  const router = useRouter();
  const rotation = useSharedValue(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState<AzuraCastMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [previewEvents, setPreviewEvents] = useState<PreviewEvent[]>([]);
  const [previewArticles, setPreviewArticles] = useState<PreviewArticle[]>([]);
  const [previewReleases, setPreviewReleases] = useState<PreviewRelease[]>([]);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [nextShow, setNextShow] = useState<Show | null>(null);
  const [showBackgroundInfoModal, setShowBackgroundInfoModal] = useState(false);

  // Initialize playback state from audioManager
  useEffect(() => {
    const updatePlaybackStatus = (status: Audio.PlaybackStatus) => {
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying);
      } else {
        setIsPlaying(false);
      }
    };

    audioManager.subscribe(updatePlaybackStatus);

    // Get initial status
    audioManager.sound?.getStatusAsync().then(status => {
      if (status?.isLoaded) {
        setIsPlaying(status.isPlaying);
      }
    });

    return () => {
      audioManager.unsubscribe(updatePlaybackStatus);
    };
  }, []);

  const fetchMetadata = useCallback(async () => {
    setLoadingMetadata(true);
    try {
      const cachedMetadata = await loadMetadataCache();
      if (cachedMetadata) {
        setMetadata(cachedMetadata);
      }

      const response = await fetchWithTimeout(AZURACAST_API_URL, { timeout: 5000 });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const station = data.find((s: any) => s.listen_url === STREAM_URL);

      if (station && station.now_playing && station.now_playing.song) {
        const newMetadata: AzuraCastMetadata = {
          displayTitle: station.now_playing.song.title || 'Unknown Title',
          displayArtist: station.now_playing.song.artist || 'Unknown Artist',
          coverImage: station.now_playing.song.art || null,
        };
        setMetadata(newMetadata);
        saveMetadataCache(newMetadata);
      } else {
        setMetadata({
          displayTitle: 'Yo Hit Radio',
          displayArtist: 'Live Stream',
          coverImage: null,
        });
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      if (isNetworkError(error)) {
        console.warn('Network error, using cached metadata if available.');
      }
      // Fallback to cached or default if network fails
      const cachedMetadata = await loadMetadataCache();
      if (cachedMetadata) {
        setMetadata(cachedMetadata);
      } else {
        setMetadata({
          displayTitle: 'Yo Hit Radio',
          displayArtist: 'Live Stream',
          coverImage: null,
        });
      }
    } finally {
      setLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
    const interval = setInterval(fetchMetadata, METADATA_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMetadata]);

  const fetchPreviewData = useCallback(async () => {
    try {
      // Fetch Events
      const eventsResponse = await fetchWithTimeout('https://yohitradio.com/wp-json/wp/v2/events?_embed&per_page=2&order=asc&orderby=meta_value&meta_key=event_date&meta_query[0][key]=event_date&meta_query[0][value]=NOW&meta_query[0][compare]=>%3D&meta_query[0][type]=DATE', { timeout: 5000 });
      const eventsData: WordPressEvent[] = await eventsResponse.json();
      const formattedEvents: PreviewEvent[] = eventsData.map(event => ({
        id: event.id.toString(),
        title: decodeHtmlEntities(event.title.rendered),
        event_date_raw: event.acf.event_date,
        event_date: parseEventDate(event.acf.event_date),
        event_location: event.acf.event_location,
        flyer_image: event._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
      })).filter(event => event.event_date && event.event_date >= new Date()) // Filter out past events
        .sort((a, b) => (a.event_date?.getTime() || 0) - (b.event_date?.getTime() || 0)) // Sort by date
        .slice(0, 2); // Take up to 2 upcoming events
      setPreviewEvents(formattedEvents);

      // Fetch News
      const newsResponse = await fetchWithTimeout('https://yohitradio.com/wp-json/wp/v2/posts?_embed&per_page=2', { timeout: 5000 });
      const newsData: WordPressPost[] = await newsResponse.json();
      const formattedNews: PreviewArticle[] = newsData.map(article => ({
        id: article.id.toString(),
        title: decodeHtmlEntities(article.title.rendered),
        published_date: article.date,
        featured_image_url: article._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
      }));
      setPreviewArticles(formattedNews);

      // Fetch New Releases (Songs)
      const releasesResponse = await fetchWithTimeout('https://yohitradio.com/wp-json/wp/v2/songs?_embed&per_page=2', { timeout: 5000 });
      const releasesData: WordPressSong[] = await releasesResponse.json();
      const formattedReleases: PreviewRelease[] = releasesData.map(song => ({
        id: song.id,
        title: decodeHtmlEntities(song.title.rendered),
        artist: song.acf.artist_name,
        coverImage: song._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
        releaseDate: song.acf.release_date,
      }));
      setPreviewReleases(formattedReleases);

    } catch (error) {
      console.error('Failed to fetch preview data:', error);
    }
  }, []);

  useEffect(() => {
    fetchPreviewData();
  }, [fetchPreviewData]);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 10000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [isPlaying, rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  const fetchSchedule = useCallback(async () => {
    try {
      const response = await fetchWithTimeout(WORDPRESS_SCHEDULE_URL, { timeout: 5000 });
      const data: WordPressScheduleItem[] = await response.json();

      const newSchedule: Schedule = {};
      data.forEach(item => {
        const day = item.acf?.day;
        if (day) {
          if (!newSchedule[day]) {
            newSchedule[day] = [];
          }
          newSchedule[day].push({
            id: item.id,
            name: decodeHtmlEntities(item.acf?.show_title || item.title.rendered),
            startTime: item.acf?.start_time || '00:00',
            endTime: item.acf?.end_time || '00:00',
            imageUrl: item._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          });
        }
      });

      // Sort shows within each day by start time
      Object.keys(newSchedule).forEach(day => {
        newSchedule[day].sort((a, b) => {
          const [aHour, aMinute] = a.startTime.split(':').map(Number);
          const [bHour, bMinute] = b.startTime.split(':').map(Number);
          return (aHour * 60 + aMinute) - (bHour * 60 + bMinute);
        });
      });

      setSchedule(newSchedule);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    if (Object.keys(schedule).length > 0) {
      const { currentShow, nextShow } = getCurrentAndNextShows(schedule);
      setCurrentShow(currentShow);
      setNextShow(nextShow);
    }
  }, [schedule]);

  const checkAndShowBackgroundInfoPopup = async () => {
    const shown = await AsyncStorage.getItem(BACKGROUND_INFO_SHOWN_KEY);
    if (!shown) {
      setShowBackgroundInfoModal(true);
    }
  };

  const dismissBackgroundInfoPopup = async () => {
    await AsyncStorage.setItem(BACKGROUND_INFO_SHOWN_KEY, 'true');
    setShowBackgroundInfoModal(false);
  };

  useEffect(() => {
    checkAndShowBackgroundInfoPopup();
  }, []);

  const togglePlayback = async () => {
    if (isPlaying) {
      await audioManager.pause();
    } else {
      await audioManager.play();
    }
  };

  const handleNavigateToEvents = () => {
    router.push('/events');
  };

  const handleNavigateToNews = () => {
    router.push('/news');
  };

  const handleNavigateToReleases = () => {
    router.push('/new-releases');
  };

  const handleEventPress = (event: PreviewEvent) => {
    router.push({
      pathname: '/event-details',
      params: {
        id: event.id,
        title: event.title,
        event_date_raw: event.event_date_raw,
        event_location: event.event_location,
        flyer_image: event.flyer_image,
      },
    });
  };

  const handleNewsPress = (article: PreviewArticle) => {
    router.push({
      pathname: '/article-details',
      params: {
        id: article.id,
        title: article.title,
        published_date: article.published_date,
        featured_image_url: article.featured_image_url,
      },
    });
  };

  const handleReleasePress = (release: PreviewRelease) => {
    router.push({
      pathname: '/new-releases', // Navigate to the New Releases tab
      params: {
        highlightId: release.id.toString(), // Optional: to scroll to or highlight the specific release
      },
    });
  };

  const formatPreviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient
          colors={[colors.darkPurple, colors.mediumPurple]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.header}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
          <View style={styles.liveIndicator}>
            <IconSymbol name="radio" style={{ color: '#FFFFFF', fontSize: 14 }} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.nowPlayingCard}>
          <LinearGradient
            colors={['rgba(100, 0, 150, 0.7)', 'rgba(50, 0, 100, 0.7)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nowPlayingGradient}
          >
            <Animated.View style={animatedStyle}>
              <OptimizedImage
                source={resolveImageSource(metadata?.coverImage || require('@/assets/images/yohitradio-placeholder.png'))}
                style={styles.coverImage}
              />
            </Animated.View>
            <View style={styles.textContainer}>
              {loadingMetadata ? (
                <ActivityIndicator size="small" color={colors.gold} />
              ) : (
                <>
                  <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                    {metadata?.displayTitle || 'Loading...'}
                  </Text>
                  <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                    {metadata?.displayArtist || 'Yo Hit Radio'}
                  </Text>
                  <Text style={styles.liveStatus}>Live Stream</Text>
                </>
              )}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.playButtonContainer}>
          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            <IconSymbol name={isPlaying ? 'pause' : 'play'} style={styles.playIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.liveButton} onPress={togglePlayback}>
            <Text style={styles.liveButtonText}>
              {isPlaying ? 'PAUSE STREAM' : 'LISTEN LIVE'}
            </Text>
          </TouchableOpacity>
          {currentShow && (
            <Text style={styles.currentShowText}>
              Now Playing: {currentShow.name} ({currentShow.startTime} - {currentShow.endTime})
            </Text>
          )}
          {nextShow && (
            <Text style={styles.nextShowText}>
              Up Next: {nextShow.name} ({nextShow.startTime} - {nextShow.endTime})
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Explore</Text>
        <View style={styles.shortcutCardsContainer}>
          <TouchableOpacity style={styles.shortcutCard} onPress={handleNavigateToNews}>
            <LinearGradient
              colors={['rgba(100, 0, 150, 0.7)', 'rgba(50, 0, 100, 0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shortcutGradient}
            >
              <IconSymbol name="newspaper" style={styles.shortcutIcon} />
              <Text style={styles.shortcutText}>News</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutCard} onPress={handleNavigateToReleases}>
            <LinearGradient
              colors={['rgba(100, 0, 150, 0.7)', 'rgba(50, 0, 100, 0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shortcutGradient}
            >
              <IconSymbol name="musical-notes" style={styles.shortcutIcon} />
              <Text style={styles.shortcutText}>New Releases</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutCard} onPress={handleNavigateToEvents}>
            <LinearGradient
              colors={['rgba(100, 0, 150, 0.7)', 'rgba(50, 0, 100, 0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shortcutGradient}
            >
              <IconSymbol name="calendar" style={styles.shortcutIcon} />
              <Text style={styles.shortcutText}>Events</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcutCard} onPress={() => router.push('/top10')}>
            <LinearGradient
              colors={['rgba(100, 0, 150, 0.7)', 'rgba(50, 0, 100, 0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shortcutGradient}
            >
              <IconSymbol name="trophy" style={styles.shortcutIcon} />
              <Text style={styles.shortcutText}>Top 10</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {previewEvents.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {previewEvents.map((event) => (
              <TouchableOpacity key={event.id} style={styles.previewCard} onPress={() => handleEventPress(event)}>
                <LinearGradient
                  colors={['rgba(100, 0, 150, 0.7)', 'rgba(50, 0, 100, 0.7)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.previewGradient}
                >
                  <OptimizedImage
                    source={resolveImageSource(event.flyer_image || require('@/assets/images/event-placeholder.png'))}
                    style={styles.previewImage}
                  />
                  <View style={styles.previewTextContainer}>
                    <Text style={styles.previewTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.previewSubtitle} numberOfLines={1}>{event.event_location}</Text>
                    <Text style={styles.previewDate}>{formatDateBadge(event.event_date_raw)}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </>
        )}

        {previewArticles.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Latest News</Text>
            {previewArticles.map((article) => (
              <TouchableOpacity key={article.id} style={styles.previewCard} onPress={() => handleNewsPress(article)}>
                <LinearGradient
                  colors={['rgba(100, 0, 150, 0.7)', 'rgba(50, 0, 100, 0.7)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.previewGradient}
                >
                  <OptimizedImage
                    source={resolveImageSource(article.featured_image_url || require('@/assets/images/news-placeholder.png'))}
                    style={styles.previewImage}
                  />
                  <View style={styles.previewTextContainer}>
                    <Text style={styles.previewTitle} numberOfLines={1}>{article.title}</Text>
                    <Text style={styles.previewDate}>{formatPreviewDate(article.published_date)}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </>
        )}

        {previewReleases.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>New Releases</Text>
            {previewReleases.map((release) => (
              <TouchableOpacity key={release.id} style={styles.previewCard} onPress={() => handleReleasePress(release)}>
                <LinearGradient
                  colors={['rgba(100, 0, 150, 0.7)', 'rgba(50, 0, 100, 0.7)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.previewGradient}
                >
                  <OptimizedImage
                    source={resolveImageSource(release.coverImage || require('@/assets/images/yohitradio-placeholder.png'))}
                    style={styles.previewImage}
                  />
                  <View style={styles.previewTextContainer}>
                    <Text style={styles.previewTitle} numberOfLines={1}>{release.title}</Text>
                    <Text style={styles.previewSubtitle} numberOfLines={1}>{release.artist}</Text>
                    <Text style={styles.previewDate}>{formatPreviewDate(release.releaseDate)}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showBackgroundInfoModal}
        onRequestClose={dismissBackgroundInfoPopup}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Background Playback</Text>
            <Text style={styles.modalText}>
              Yo Hit Radio can play in the background! You can switch to other apps or lock your phone and the music will continue.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={dismissBackgroundInfoPopup}>
              <Text style={styles.modalButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;
