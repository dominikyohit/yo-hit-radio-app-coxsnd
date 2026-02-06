
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { parseEventDate, formatDateBadge } from '@/utils/dateHelpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import AudioManager from '@/utils/audioManager';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';
import { OptimizedImage } from '@/components/OptimizedImage';
import { fetchWithTimeout, isNetworkError } from '@/utils/networkHelpers';
import { saveMetadataCache, loadMetadataCache } from '@/utils/metadataCache';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';

interface Show {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  imageUrl: string | null;
}

type Schedule = {
  [day: string]: Show[];
};

// AzuraCast metadata interface
interface AzuraCastMetadata {
  displayTitle: string;
  displayArtist: string;
  coverImage: string | null;
}

// Preview data interfaces
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
    'wp:featuredmedia'?: Array<{
      source_url?: string;
    }>;
  };
}

const STREAM_URL = 'https://a13.asurahosting.com/listen/yo_hit_radio/radio.mp3';
const METADATA_POLL_INTERVAL = 12000; // 12 seconds - polls AzuraCast API every 12 seconds
const AZURACAST_API_URL = 'https://a13.asurahosting.com/api/nowplaying/yo_hit_radio';
const WORDPRESS_SCHEDULE_URL = 'https://yohitradio.com/wp-json/wp/v2/calendrier?per_page=100&_embed';

// Cache keys for AsyncStorage
const CACHE_KEY_EVENTS = '@home_preview_events';
const CACHE_KEY_NEWS = '@home_preview_news';
const CACHE_KEY_RELEASES = '@home_preview_releases';
const CACHE_KEY_SCHEDULE = '@home_schedule';

// Function to get current and next shows from WordPress schedule
const getCurrentAndNextShows = (schedule: Schedule): { currentShow: Show | null; nextShow: Show | null } => {
  const now = new Date();
  const dayIndex = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[dayIndex];
  const todaysSchedule = schedule[today];

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
    let nextDaySchedule = schedule[nextDay];

    if (nextDaySchedule && nextDaySchedule.length > 0) {
      nextShow = nextDaySchedule[0];
    }
  }

  return { currentShow, nextShow };
};

// Helper to resolve image sources
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function HomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState<AzuraCastMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [nextShow, setNextShow] = useState<Show | null>(null);
  const [schedule, setSchedule] = useState<Schedule>({});
  
  // Preview sections state
  const [previewEvents, setPreviewEvents] = useState<PreviewEvent[]>([]);
  const [previewNews, setPreviewNews] = useState<PreviewArticle[]>([]);
  const [previewReleases, setPreviewReleases] = useState<PreviewRelease[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Track if data has been fetched (for caching logic)
  const hasFetchedEvents = useRef(false);
  const hasFetchedNews = useRef(false);
  const hasFetchedReleases = useRef(false);
  const hasFetchedSchedule = useRef(false);
  
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
    console.log('[Home] Fetching metadata from AzuraCast API...');
    try {
      // Use fetchWithTimeout for network resilience
      const response = await fetchWithTimeout(
        AZURACAST_API_URL,
        {},
        { timeout: 8000, retries: 2, retryDelay: 1000 }
      );
      
      const data = await response.json();
      console.log('[Home] Fetched metadata from AzuraCast API:', data);

      const title = data?.now_playing?.song?.title || '';
      const artist = data?.now_playing?.song?.artist || '';
      const cover = data?.now_playing?.song?.art || '';

      // Fallback for missing title/artist
      if (!title && !artist) {
        const fallbackMetadata = {
          displayTitle: 'Live Stream',
          displayArtist: 'Yo Hit Radio',
          coverImage: null,
        };
        setMetadata(fallbackMetadata);
        
        // Save to cache
        await saveMetadataCache(fallbackMetadata);
        
        // Update lock screen metadata even when paused
        await audioManager.updateMetadata(
          fallbackMetadata.displayTitle,
          fallbackMetadata.displayArtist
        );
      } else {
        const newMetadata = {
          displayTitle: title,
          displayArtist: artist,
          coverImage: cover || null,
        };
        setMetadata(newMetadata);
        
        // Save to cache for instant display on next load
        await saveMetadataCache(newMetadata);
        
        // CRITICAL: Update lock screen metadata even when paused
        // This ensures Now Playing info stays current (METADATA RULE)
        await audioManager.updateMetadata(
          newMetadata.displayTitle,
          newMetadata.displayArtist,
          newMetadata.coverImage || undefined
        );
        
        console.log('[Home] Updated lock screen metadata and cache:', {
          title: newMetadata.displayTitle,
          artist: newMetadata.displayArtist,
        });
      }
    } catch (error) {
      console.error('[Home] Error fetching metadata from AzuraCast API:', error);
      
      // On network error, keep existing metadata (don't clear it)
      // This prevents blank screens on slow networks
      if (isNetworkError(error)) {
        console.log('[Home] Network error - keeping existing metadata visible');
      } else {
        // Only set fallback if we don't have any metadata yet
        if (!metadata) {
          const fallbackMetadata = {
            displayTitle: 'Live Stream',
            displayArtist: 'Yo Hit Radio',
            coverImage: null,
          };
          setMetadata(fallbackMetadata);
          
          // Update lock screen metadata even on error
          await audioManager.updateMetadata(
            fallbackMetadata.displayTitle,
            fallbackMetadata.displayArtist
          );
        }
      }
    }
  }, [audioManager, metadata]);

  // Fetch schedule from WordPress with caching
  const fetchSchedule = useCallback(async (forceRefresh: boolean = false) => {
    // If already fetched and not forcing refresh, skip
    if (hasFetchedSchedule.current && !forceRefresh) {
      console.log('[Home] Schedule already fetched - using cached data');
      return;
    }

    console.log('[Home] Fetching schedule from WordPress...');
    try {
      // Try to load from cache first
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY_SCHEDULE);
        if (cached) {
          const cachedSchedule = JSON.parse(cached);
          setSchedule(cachedSchedule);
          console.log('[Home] Loaded schedule from cache');
        }
      }

      // Use fetchWithTimeout for network resilience
      const response = await fetchWithTimeout(
        WORDPRESS_SCHEDULE_URL,
        {},
        { timeout: 10000, retries: 2, retryDelay: 1000 }
      );
      
      const data: WordPressScheduleItem[] = await response.json();
      console.log(`[Home] Fetched ${data.length} schedule items from WordPress`);

      // Parse and transform data
      const shows: Show[] = data.map((item) => {
        const acf = item.acf || {};
        const showTitle = acf.show_title || item.title.rendered || 'Untitled Show';
        const decodedTitle = decodeHtmlEntities(showTitle);
        const startTime = acf.start_time || '00:00';
        const endTime = acf.end_time || '00:00';
        const dayRaw = acf.day || 'unknown';
        const dayLowercase = dayRaw.toLowerCase().trim();

        // Extract featured image
        let imageUrl: string | null = null;
        if (item._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
          imageUrl = item._embedded['wp:featuredmedia'][0].source_url;
        }

        // Capitalize day name
        const dayMap: { [key: string]: string } = {
          monday: 'Monday',
          tuesday: 'Tuesday',
          wednesday: 'Wednesday',
          thursday: 'Thursday',
          friday: 'Friday',
          saturday: 'Saturday',
          sunday: 'Sunday',
        };
        const dayCapitalized = dayMap[dayLowercase] || dayLowercase;

        return {
          id: item.id,
          name: decodedTitle,
          startTime,
          endTime,
          imageUrl,
          day: dayCapitalized,
          sortOrder: acf.sort_order !== undefined ? acf.sort_order : 9999,
        };
      });

      // Group by day
      const grouped: Schedule = {};
      shows.forEach((show: any) => {
        if (!grouped[show.day]) {
          grouped[show.day] = [];
        }
        grouped[show.day].push(show);
      });

      // Sort shows within each day
      Object.keys(grouped).forEach((day) => {
        grouped[day].sort((a: any, b: any) => {
          // Primary: sort_order ascending
          if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
          }
          // Fallback: start_time ascending (string compare)
          return a.startTime.localeCompare(b.startTime);
        });
      });

      setSchedule(grouped);
      hasFetchedSchedule.current = true;
      
      // Save to cache
      await AsyncStorage.setItem(CACHE_KEY_SCHEDULE, JSON.stringify(grouped));
      
      console.log('[Home] Schedule loaded and cached successfully');
    } catch (error) {
      console.error('[Home] Error fetching schedule:', error);
      // Don't clear existing schedule on error - keep it visible
      if (isNetworkError(error)) {
        console.log('[Home] Network error - keeping existing schedule visible');
      }
    }
  }, []);

  const updateShows = useCallback(() => {
    const { currentShow: current, nextShow: next } = getCurrentAndNextShows(schedule);
    console.log('[Home] Updated shows - Current:', current?.name, 'Next:', next?.name);
    setCurrentShow(current);
    setNextShow(next);
  }, [schedule]);

  // Fetch preview data with caching
  const fetchPreviewData = useCallback(async (forceRefresh: boolean = false) => {
    // If already fetched and not forcing refresh, skip
    if (hasFetchedEvents.current && hasFetchedNews.current && hasFetchedReleases.current && !forceRefresh) {
      console.log('[Home] Preview data already fetched - using cached data');
      return;
    }

    console.log('[Home] Fetching preview data for Events, News, and Releases');
    if (!forceRefresh) {
      setLoadingPreviews(true);
    }
    
    // EVENTS
    if (!hasFetchedEvents.current || forceRefresh) {
      try {
        // Try to load from cache first
        if (!forceRefresh) {
          const cached = await AsyncStorage.getItem(CACHE_KEY_EVENTS);
          if (cached) {
            const cachedEvents = JSON.parse(cached);
            setPreviewEvents(cachedEvents);
            console.log('[Home] Loaded events from cache');
          }
        }

        // Fetch Events (2 upcoming) with timeout
        const eventsResponse = await fetchWithTimeout(
          'https://yohitradio.com/wp-json/wp/v2/bal?_embed&per_page=100',
          {},
          { timeout: 10000, retries: 1, retryDelay: 1000 }
        );
        
        const eventsData: WordPressEvent[] = await eventsResponse.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingEvents: PreviewEvent[] = eventsData
          .map((event) => {
            const eventDate = parseEventDate(event.acf?.event_date);
            const decodedTitle = decodeHtmlEntities(event.title.rendered);
            
            return {
              id: String(event.id),
              title: decodedTitle,
              event_date_raw: event.acf?.event_date || '',
              event_date: eventDate,
              event_location: event.acf?.event_location || '',
              flyer_image: event._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
            };
          })
          .filter((event) => {
            if (!event.event_date) return false;
            const eventDateNormalized = new Date(event.event_date);
            eventDateNormalized.setHours(0, 0, 0, 0);
            return eventDateNormalized >= today;
          })
          .sort((a, b) => {
            const timeA = a.event_date?.getTime() || 0;
            const timeB = b.event_date?.getTime() || 0;
            return timeA - timeB;
          })
          .slice(0, 2);
        
        setPreviewEvents(upcomingEvents);
        hasFetchedEvents.current = true;
        
        // Save to cache
        await AsyncStorage.setItem(CACHE_KEY_EVENTS, JSON.stringify(upcomingEvents));
        
        console.log('[Home] Fetched and cached preview events:', upcomingEvents.length);
      } catch (error) {
        console.error('[Home] Error fetching preview events:', error);
        // Keep existing events on error
      }
    }
    
    // NEWS
    if (!hasFetchedNews.current || forceRefresh) {
      try {
        // Try to load from cache first
        if (!forceRefresh) {
          const cached = await AsyncStorage.getItem(CACHE_KEY_NEWS);
          if (cached) {
            const cachedNews = JSON.parse(cached);
            setPreviewNews(cachedNews);
            console.log('[Home] Loaded news from cache');
          }
        }

        // Fetch News (2 latest) with timeout
        const newsResponse = await fetchWithTimeout(
          'https://yohitradio.com/wp-json/wp/v2/posts?_embed&per_page=2',
          {},
          { timeout: 10000, retries: 1, retryDelay: 1000 }
        );
        
        const newsData: WordPressPost[] = await newsResponse.json();
        const latestNews: PreviewArticle[] = newsData.map((post) => {
          const decodedTitle = decodeHtmlEntities(post.title?.rendered ?? '');
          
          return {
            id: String(post.id),
            title: decodedTitle,
            published_date: post.date ?? '',
            featured_image_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null,
          };
        });
        
        setPreviewNews(latestNews);
        hasFetchedNews.current = true;
        
        // Save to cache
        await AsyncStorage.setItem(CACHE_KEY_NEWS, JSON.stringify(latestNews));
        
        console.log('[Home] Fetched and cached preview news:', latestNews.length);
      } catch (error) {
        console.error('[Home] Error fetching preview news:', error);
        // Keep existing news on error
      }
    }
    
    // RELEASES
    if (!hasFetchedReleases.current || forceRefresh) {
      try {
        // Try to load from cache first
        if (!forceRefresh) {
          const cached = await AsyncStorage.getItem(CACHE_KEY_RELEASES);
          if (cached) {
            const cachedReleases = JSON.parse(cached);
            setPreviewReleases(cachedReleases);
            console.log('[Home] Loaded releases from cache');
          }
        }

        // Fetch Releases (2 latest) with timeout
        const releasesResponse = await fetchWithTimeout(
          'https://yohitradio.com/wp-json/wp/v2/song?per_page=2&orderby=date&order=desc&_embed',
          {},
          { timeout: 10000, retries: 1, retryDelay: 1000 }
        );
        
        const releasesData: WordPressSong[] = await releasesResponse.json();
        const latestReleases: PreviewRelease[] = releasesData.map((song) => {
          const decodedTitle = decodeHtmlEntities(song.title.rendered);
          
          // Format release date
          let releaseDate = '';
          if (song.acf?.release_date && /^\d{8}$/.test(song.acf.release_date)) {
            const year = song.acf.release_date.substring(0, 4);
            const month = song.acf.release_date.substring(4, 6);
            const day = song.acf.release_date.substring(6, 8);
            const date = new Date(`${year}-${month}-${day}`);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            releaseDate = `${months[date.getMonth()]} ${day}, ${year}`;
          } else if (song.date) {
            const date = new Date(song.date);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            releaseDate = `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
          }
          
          return {
            id: song.id,
            title: decodedTitle,
            artist: song.acf?.artist_name || 'Unknown Artist',
            coverImage: song._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
            releaseDate: releaseDate,
          };
        });
        
        setPreviewReleases(latestReleases);
        hasFetchedReleases.current = true;
        
        // Save to cache
        await AsyncStorage.setItem(CACHE_KEY_RELEASES, JSON.stringify(latestReleases));
        
        console.log('[Home] Fetched and cached preview releases:', latestReleases.length);
      } catch (error) {
        console.error('[Home] Error fetching preview releases:', error);
        // Keep existing releases on error
      }
    }
    
    setLoadingPreviews(false);
  }, []);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    console.log('[Home] User pulled to refresh - refreshing all data');
    setRefreshing(true);
    
    // Force refresh all data
    await Promise.all([
      fetchMetadata(),
      fetchSchedule(true),
      fetchPreviewData(true),
    ]);
    
    setRefreshing(false);
    console.log('[Home] Refresh complete');
  }, [fetchMetadata, fetchSchedule, fetchPreviewData]);

  // Load cached metadata immediately on mount, then start polling
  // FIXED: This effect only runs once on mount (empty dependency array)
  useEffect(() => {
    console.log('[Home] Component mounted - loading cached metadata and starting polling');
    
    // Load cached metadata first for instant display
    loadMetadataCache().then((cached) => {
      if (cached) {
        console.log('[Home] Displaying cached metadata immediately');
        setMetadata({
          displayTitle: cached.displayTitle,
          displayArtist: cached.displayArtist,
          coverImage: cached.coverImage,
        });
      }
    });

    // Start metadata polling (runs independently)
    console.log('[Home] Starting continuous metadata polling');
    console.log('[Home] METADATA RULE: Metadata will refresh every 12 seconds even when playback is stopped');
    
    // Initial fetch
    fetchMetadata();
    
    // Set up interval
    metadataInterval.current = setInterval(() => {
      fetchMetadata();
    }, METADATA_POLL_INTERVAL);

    // Cleanup on unmount
    return () => {
      console.log('[Home] Component unmounting - stopping metadata polling');
      if (metadataInterval.current) {
        clearInterval(metadataInterval.current);
        metadataInterval.current = null;
      }
    };
  }, []); // Empty dependency array - only runs once on mount

  // Fetch schedule on mount (with caching)
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Update shows when schedule changes
  useEffect(() => {
    if (Object.keys(schedule).length > 0) {
      updateShows();
      showUpdateInterval.current = setInterval(updateShows, 60000);

      return () => {
        if (showUpdateInterval.current) {
          clearInterval(showUpdateInterval.current);
        }
      };
    }
  }, [schedule, updateShows]);

  // Fetch preview data on mount (with caching)
  useEffect(() => {
    fetchPreviewData();
  }, [fetchPreviewData]);

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        console.log('[Home] User tapped Stop button - stopping audio');
        console.log('[Home] METADATA RULE: Metadata will continue refreshing even though playback stopped');
        await audioManager.stopCurrentAudio();
        setIsPlaying(false);
        console.log('[Home] Audio stopped');
        console.log('[Home] Android: Foreground Service stopped, notification removed');
        console.log('[Home] iOS: Lock screen controls cleared');
        console.log('[Home] Metadata polling continues (METADATA RULE)');
      } else {
        console.log('[Home] User tapped Listen Live button');
        setLoading(true);
        
        const title = metadata?.displayTitle || 'Yo Hit Radio – Live Stream';
        const artist = metadata?.displayArtist || 'Live Stream';
        const artwork = metadata?.coverImage || undefined;
        
        console.log('[Home] Starting live stream with Android Foreground Service');
        await audioManager.playAudio(STREAM_URL, true, title, artist, artwork);
        setIsPlaying(true);
        setLoading(false);
        
        console.log('[Home] Live stream started successfully');
        console.log('[Home] Android: Foreground Service running (foregroundServiceType="mediaPlayback")');
        console.log('[Home] Android: Persistent notification visible with Play/Pause controls');
        console.log('[Home] iOS: Background audio active');
        console.log('[Home] Background playback active - audio will continue when:');
        console.log('[Home]   ✓ App goes to background');
        console.log('[Home]   ✓ User opens another app (WhatsApp, Facebook, etc.)');
        console.log('[Home]   ✓ Screen turns off or device locks');
        console.log('[Home]   ✓ Device sleeps/hibernates');
        console.log('[Home] Lock screen controls available (Play/Pause)');
        
        if (Platform.OS === 'android') {
          console.log('[Home] Android: Media notification visible in notification shade');
          console.log('[Home] Android: Audio focus acquired (DoNotMix mode)');
          console.log('[Home] Android: MediaSession active for Android Auto support');
        } else if (Platform.OS === 'ios') {
          console.log('[Home] iOS: AVAudioSession configured for background playback');
          console.log('[Home] iOS: Now Playing info updated on lock screen');
        }
      }
    } catch (error) {
      console.error('[Home] Error toggling playback:', error);
      setLoading(false);
      setIsPlaying(false);
    }
  };

  const handleNavigateToEvents = () => {
    console.log('[Home] User tapped More events');
    router.push('/(tabs)/events');
  };

  const handleNavigateToNews = () => {
    console.log('[Home] User tapped More news');
    router.push('/(tabs)/news');
  };

  const handleNavigateToReleases = () => {
    console.log('[Home] User tapped More releases');
    router.push('/(tabs)/new-releases');
  };

  const handleEventPress = (event: PreviewEvent) => {
    console.log('[Home] User tapped event preview:', event.title);
    router.push({
      pathname: '/event-details',
      params: {
        id: event.id,
        title: event.title,
        event_date_raw: event.event_date_raw,
        event_location: event.event_location,
        flyer_image: event.flyer_image || '',
      },
    });
  };

  const handleNewsPress = (article: PreviewArticle) => {
    console.log('[Home] User tapped news preview:', article.title);
    router.push({
      pathname: '/article-details',
      params: { id: article.id },
    });
  };

  const handleReleasePress = (release: PreviewRelease) => {
    console.log('[Home] User tapped release preview:', release.title);
    router.push('/(tabs)/new-releases');
  };

  const formatPreviewDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch (error) {
      return '';
    }
  };

  // Parse metadata with proper fallbacks - ATOMIC JSX RULES
  const displayTitle = metadata?.displayTitle || 'Live Stream';
  const displayArtist = metadata?.displayArtist || 'Yo Hit Radio';
  const displayArtwork = metadata?.coverImage;
  
  // Fallback logo source
  const fallbackLogo = require('@/assets/images/final_quest_240x240.png');

  return (
    <LinearGradient colors={['#1a0033', '#330066', '#1a0033']} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
              colors={['#FFD700']}
            />
          }
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
            <Animated.View style={[styles.coverImageContainer, animatedStyle]}>
              <OptimizedImage
                source={displayArtwork}
                fallbackSource={fallbackLogo}
                style={styles.coverImage}
                resizeMode="cover"
                placeholderIcon="music.note"
                placeholderIconMaterial="music-note"
                placeholderColor="rgba(255, 215, 0, 0.3)"
              />
            </Animated.View>
            <Text style={styles.songTitle} numberOfLines={2}>
              {displayTitle}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {displayArtist}
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

          {/* UPDATED CURRENT SHOW AND NEXT SHOW CARDS - MATCHING EVENT/NEWS/RELEASE STYLE */}
          <View style={styles.showCardsContainer}>
            {/* ON AIR NOW CARD */}
            <View style={styles.showCard}>
              <View style={styles.showCardBadgeContainer}>
                <View style={styles.onAirBadge}>
                  <View style={styles.onAirDot} />
                  <Text style={styles.onAirText}>ON AIR NOW</Text>
                </View>
              </View>
              {currentShow ? (
                <>
                  <OptimizedImage
                    source={currentShow.imageUrl}
                    style={styles.showCardImage}
                    resizeMode="cover"
                    placeholderIcon="music.note"
                    placeholderIconMaterial="music-note"
                    placeholderColor="rgba(255, 215, 0, 0.3)"
                  />
                  <View style={styles.showCardTextContent}>
                    <Text style={styles.showCardTitle} numberOfLines={2}>
                      {currentShow.name}
                    </Text>
                    <Text style={styles.showCardTime}>
                      {currentShow.startTime}–{currentShow.endTime}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.showCardImagePlaceholder}>
                    <IconSymbol
                      ios_icon_name="music.note"
                      android_material_icon_name="music-note"
                      size={32}
                      color="rgba(255, 215, 0, 0.2)"
                    />
                  </View>
                  <View style={styles.showCardTextContent}>
                    <Text style={styles.showCardNoShow}>No show scheduled</Text>
                  </View>
                </>
              )}
            </View>

            {/* UP NEXT CARD */}
            <View style={styles.showCard}>
              <View style={styles.showCardBadgeContainer}>
                <View style={styles.upNextBadge}>
                  <Text style={styles.upNextText}>UP NEXT</Text>
                </View>
              </View>
              {nextShow ? (
                <>
                  <OptimizedImage
                    source={nextShow.imageUrl}
                    style={styles.showCardImage}
                    resizeMode="cover"
                    placeholderIcon="music.note"
                    placeholderIconMaterial="music-note"
                    placeholderColor="rgba(255, 215, 0, 0.3)"
                  />
                  <View style={styles.showCardTextContent}>
                    <Text style={styles.showCardTitle} numberOfLines={2}>
                      {nextShow.name}
                    </Text>
                    <Text style={styles.showCardTime}>
                      {nextShow.startTime}–{nextShow.endTime}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.showCardImagePlaceholder}>
                    <IconSymbol
                      ios_icon_name="music.note"
                      android_material_icon_name="music-note"
                      size={32}
                      color="rgba(255, 215, 0, 0.2)"
                    />
                  </View>
                  <View style={styles.showCardTextContent}>
                    <Text style={styles.showCardNoShow}>No show scheduled</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* PREVIEW SECTION 1: UPCOMING EVENTS */}
          <View style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={handleNavigateToEvents} activeOpacity={0.7}>
                <Text style={styles.moreLink}>More events</Text>
              </TouchableOpacity>
            </View>
            
            {loadingPreviews ? (
              <View style={styles.previewLoading}>
                <ActivityIndicator size="small" color="#FFD700" />
              </View>
            ) : previewEvents.length === 0 ? (
              <View style={styles.previewEmpty}>
                <Text style={styles.previewEmptyText}>No upcoming events</Text>
              </View>
            ) : (
              <View style={styles.previewCardsContainer}>
                {previewEvents.map((event, index) => {
                  const dateBadgeText = formatDateBadge(event.event_date);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.previewCard}
                      onPress={() => handleEventPress(event)}
                      activeOpacity={0.8}
                    >
                      <OptimizedImage
                        source={event.flyer_image}
                        style={styles.previewImage}
                        resizeMode="cover"
                        placeholderIcon="calendar"
                        placeholderIconMaterial="event"
                        placeholderColor="rgba(255, 215, 0, 0.3)"
                      />
                      <View style={styles.previewCardContent}>
                        <Text style={styles.previewCardTitle} numberOfLines={2}>
                          {event.title}
                        </Text>
                        <View style={styles.previewCardMeta}>
                          {dateBadgeText && (
                            <Text style={styles.previewCardMetaText}>{dateBadgeText}</Text>
                          )}
                        </View>
                        {event.event_location && (
                          <View style={styles.previewCardLocation}>
                            <IconSymbol
                              ios_icon_name="location"
                              android_material_icon_name="location-on"
                              size={12}
                              color="#B8B8B8"
                            />
                            <Text style={styles.previewCardLocationText} numberOfLines={1}>
                              {event.event_location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* PREVIEW SECTION 2: LATEST NEWS */}
          <View style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Latest News</Text>
              <TouchableOpacity onPress={handleNavigateToNews} activeOpacity={0.7}>
                <Text style={styles.moreLink}>More news</Text>
              </TouchableOpacity>
            </View>
            
            {loadingPreviews ? (
              <View style={styles.previewLoading}>
                <ActivityIndicator size="small" color="#FFD700" />
              </View>
            ) : previewNews.length === 0 ? (
              <View style={styles.previewEmpty}>
                <Text style={styles.previewEmptyText}>No news available</Text>
              </View>
            ) : (
              <View style={styles.previewCardsContainer}>
                {previewNews.map((article, index) => {
                  const formattedDate = formatPreviewDate(article.published_date);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.previewCard}
                      onPress={() => handleNewsPress(article)}
                      activeOpacity={0.8}
                    >
                      <OptimizedImage
                        source={article.featured_image_url}
                        style={styles.previewImage}
                        resizeMode="cover"
                        placeholderIcon="newspaper"
                        placeholderIconMaterial="article"
                        placeholderColor="rgba(255, 215, 0, 0.3)"
                      />
                      <View style={styles.previewCardContent}>
                        <Text style={styles.previewCardTitle} numberOfLines={2}>
                          {article.title}
                        </Text>
                        {formattedDate && (
                          <View style={styles.previewCardMeta}>
                            <Text style={styles.previewCardMetaText}>{formattedDate}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* PREVIEW SECTION 3: NEW RELEASES */}
          <View style={styles.previewSection}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>New Releases</Text>
              <TouchableOpacity onPress={handleNavigateToReleases} activeOpacity={0.7}>
                <Text style={styles.moreLink}>More releases</Text>
              </TouchableOpacity>
            </View>
            
            {loadingPreviews ? (
              <View style={styles.previewLoading}>
                <ActivityIndicator size="small" color="#FFD700" />
              </View>
            ) : previewReleases.length === 0 ? (
              <View style={styles.previewEmpty}>
                <Text style={styles.previewEmptyText}>No releases available</Text>
              </View>
            ) : (
              <View style={styles.previewCardsContainer}>
                {previewReleases.map((release, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.previewCard}
                    onPress={() => handleReleasePress(release)}
                    activeOpacity={0.8}
                  >
                    <OptimizedImage
                      source={release.coverImage}
                      style={styles.previewImage}
                      resizeMode="cover"
                      placeholderIcon="music.note"
                      placeholderIconMaterial="music-note"
                      placeholderColor="rgba(255, 215, 0, 0.3)"
                    />
                    <View style={styles.previewCardContent}>
                      <Text style={styles.previewCardTitle} numberOfLines={2}>
                        {release.title}
                      </Text>
                      <View style={styles.previewCardMeta}>
                        <Text style={styles.previewCardMetaText}>{release.artist}</Text>
                      </View>
                      {release.releaseDate && (
                        <View style={styles.previewCardMeta}>
                          <Text style={styles.previewCardDateText}>{release.releaseDate}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  artistName: {
    color: '#CCCCCC',
    fontSize: 15,
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
  // UPDATED SHOW CARDS STYLES - MATCHING EVENT/NEWS/RELEASE CARD STYLE
  showCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  showCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  showCardBadgeContainer: {
    padding: 10,
    paddingBottom: 8,
  },
  onAirBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 255, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  onAirDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF00',
  },
  onAirText: {
    color: '#00FF00',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  upNextBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  upNextText: {
    color: '#B19CD9',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  showCardImage: {
    width: '100%',
    height: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  showCardImagePlaceholder: {
    width: '100%',
    height: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  showCardTextContent: {
    padding: 12,
    paddingTop: 10,
  },
  showCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 18,
  },
  showCardTime: {
    color: '#B8B8B8',
    fontSize: 12,
    fontWeight: '500',
  },
  showCardNoShow: {
    color: '#888888',
    fontSize: 13,
    fontStyle: 'italic',
  },
  // PREVIEW SECTION STYLES (unchanged)
  previewSection: {
    marginBottom: 30,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  moreLink: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  previewCardsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  previewCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  previewImage: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  previewImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCardContent: {
    padding: 12,
  },
  previewCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 20,
  },
  previewCardMeta: {
    marginBottom: 4,
  },
  previewCardMetaText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  previewCardDateText: {
    color: '#B8B8B8',
    fontSize: 11,
  },
  previewCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  previewCardLocationText: {
    color: '#B8B8B8',
    fontSize: 11,
    flex: 1,
  },
  previewLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  previewEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  previewEmptyText: {
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
