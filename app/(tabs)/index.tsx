
import { colors } from '@/styles/commonStyles';
import AudioManager from '@/utils/audioManager';
import { saveMetadataCache, loadMetadataCache } from '@/utils/metadataCache';
import { OptimizedImage } from '@/components/OptimizedImage';
import { IconSymbol } from '@/components/IconSymbol';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';
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
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWithTimeout, isNetworkError } from '@/utils/networkHelpers';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseEventDate, formatDateBadge } from '@/utils/dateHelpers';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Show {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  imageUrl: string | null;
}

type Schedule = Show[];

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
const METADATA_POLL_INTERVAL = 10000;
const AZURACAST_API_URL = 'https://yohitradio.radioca.st/api/nowplaying/yohitradio';
const WORDPRESS_SCHEDULE_URL = 'https://yohitradio.com/wp-json/wp/v2/schedule?_embed&per_page=100';
const BACKGROUND_INFO_SHOWN_KEY = 'background_info_shown';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
    borderRadius: 60,
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nowPlayingCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nowPlayingContent: {
    padding: 20,
  },
  nowPlayingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  nowPlayingCover: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: colors.cardBackground,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nowPlayingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  nowPlayingArtist: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  playButtonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  listenLiveButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  listenLiveGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  listenLiveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shortcutsContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  shortcutGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shortcutCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  shortcutContent: {
    padding: 15,
    alignItems: 'center',
  },
  shortcutIcon: {
    marginBottom: 8,
  },
  shortcutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  previewSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  previewCard: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  previewImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.cardBackground,
  },
  previewContent: {
    padding: 15,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  previewMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

function getCurrentAndNextShows(schedule: Schedule): { current: Show | null; next: Show | null } {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const todayShows = schedule.filter(show => show.name === currentDay);

  let current: Show | null = null;
  let next: Show | null = null;

  for (let i = 0; i < todayShows.length; i++) {
    const show = todayShows[i];
    const [startHour, startMin] = show.startTime.split(':').map(Number);
    const [endHour, endMin] = show.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (currentTime >= startTime && currentTime < endTime) {
      current = show;
      next = todayShows[i + 1] || null;
      break;
    }

    if (currentTime < startTime && !next) {
      next = show;
    }
  }

  return { current, next };
}

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function HomeScreen() {
  const metadataIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState<AzuraCastMetadata>({
    displayTitle: 'Yo Hit Radio',
    displayArtist: 'La radio des hits',
    coverImage: null,
  });
  const [schedule, setSchedule] = useState<Schedule>([]);
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [nextShow, setNextShow] = useState<Show | null>(null);
  const [previewEvents, setPreviewEvents] = useState<PreviewEvent[]>([]);
  const [previewArticles, setPreviewArticles] = useState<PreviewArticle[]>([]);
  const [previewReleases, setPreviewReleases] = useState<PreviewRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      await fetchSchedule();
      await fetchPreviewData();
      setLoading(false);
    };

    initializeApp();
  }, []);

  useEffect(() => {
    updateShows();
  }, [schedule]);

  const updateShows = useCallback(() => {
    if (schedule.length > 0) {
      const { current, next } = getCurrentAndNextShows(schedule);
      setCurrentShow(current);
      setNextShow(next);
    }
  }, [schedule]);

  useEffect(() => {
    fetchPreviewData();
  }, []);

  const rotation = useSharedValue(0);

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
      const cachedData = await loadMetadataCache();
      if (cachedData) {
        setMetadata(cachedData);
      }

      const response = await fetchWithTimeout(AZURACAST_API_URL, { timeout: 5000 });
      const data = await response.json();

      const newMetadata: AzuraCastMetadata = {
        displayTitle: data.now_playing?.song?.title || 'Yo Hit Radio',
        displayArtist: data.now_playing?.song?.artist || 'La radio des hits',
        coverImage: data.now_playing?.song?.art || null,
      };

      setMetadata(newMetadata);
      await saveMetadataCache(newMetadata);

      if (isPlaying) {
        await AudioManager.updateMetadata(
          newMetadata.displayTitle,
          newMetadata.displayArtist,
          newMetadata.coverImage || ''
        );
      }
    } catch (error) {
      console.log('Failed to fetch metadata:', error);
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const fetchSchedule = useCallback(async () => {
    try {
      const response = await fetchWithTimeout(WORDPRESS_SCHEDULE_URL, { timeout: 10000 });
      const data: WordPressScheduleItem[] = await response.json();

      const parsedSchedule: Schedule = data
        .map((item) => ({
          id: item.id,
          name: item.acf?.day || '',
          startTime: item.acf?.start_time || '',
          endTime: item.acf?.end_time || '',
          imageUrl: item._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
        }))
        .filter((show) => show.name && show.startTime && show.endTime);

      setSchedule(parsedSchedule);
    } catch (error) {
      console.log('Failed to fetch schedule:', error);
    }
  }, []);

  async function checkAndShowBackgroundInfoPopup() {
    // Removed background info popup logic
  }

  async function dismissBackgroundInfoPopup() {
    // Removed background info popup logic
  }

  async function togglePlayback() {
    console.log('User tapped Play/Pause button');
    try {
      if (isPlaying) {
        console.log('Stopping playback');
        await AudioManager.stopCurrentAudio();
        setIsPlaying(false);
        if (metadataIntervalRef.current) {
          clearInterval(metadataIntervalRef.current);
          metadataIntervalRef.current = null;
        }
      } else {
        console.log('Starting playback');
        await AudioManager.playAudio(
          STREAM_URL,
          metadata.displayTitle,
          metadata.displayArtist,
          metadata.coverImage || ''
        );
        setIsPlaying(true);
        await fetchMetadata();
        metadataIntervalRef.current = setInterval(fetchMetadata, METADATA_POLL_INTERVAL);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  }

  function handleNavigateToEvents() {
    console.log('User tapped Events shortcut');
    router.push('/(tabs)/events');
  }

  function handleNavigateToNews() {
    console.log('User tapped News shortcut');
    router.push('/(tabs)/news');
  }

  function handleNavigateToReleases() {
    console.log('User tapped New Releases shortcut');
    router.push('/(tabs)/new-releases');
  }

  function handleEventPress(event: PreviewEvent) {
    console.log('User tapped event:', event.title);
    router.push({
      pathname: '/event-details',
      params: {
        eventId: event.id,
        title: event.title,
        event_date_raw: event.event_date_raw,
        event_location: event.event_location,
        flyer_image: event.flyer_image || '',
      },
    });
  }

  function handleNewsPress(article: PreviewArticle) {
    console.log('User tapped article:', article.title);
    router.push({
      pathname: '/article-details',
      params: { id: article.id },
    });
  }

  function handleReleasePress(release: PreviewRelease) {
    console.log('User tapped release:', release.title);
    router.push('/(tabs)/new-releases');
  }

  async function fetchPreviewData() {
    try {
      const [eventsRes, articlesRes, releasesRes] = await Promise.all([
        fetchWithTimeout('https://yohitradio.com/wp-json/wp/v2/events?_embed&per_page=3', { timeout: 10000 }),
        fetchWithTimeout('https://yohitradio.com/wp-json/wp/v2/posts?_embed&per_page=3', { timeout: 10000 }),
        fetchWithTimeout('https://yohitradio.com/wp-json/wp/v2/songs?_embed&per_page=3', { timeout: 10000 }),
      ]);

      const eventsData: WordPressEvent[] = await eventsRes.json();
      const articlesData: WordPressPost[] = await articlesRes.json();
      const releasesData: WordPressSong[] = await releasesRes.json();

      const events: PreviewEvent[] = eventsData.map((event) => ({
        id: String(event.id),
        title: decodeHtmlEntities(event.title.rendered),
        event_date_raw: event.acf.event_date,
        event_date: parseEventDate(event.acf.event_date),
        event_location: event.acf.event_location,
        flyer_image: event._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
      }));

      const articles: PreviewArticle[] = articlesData.map((article) => ({
        id: String(article.id),
        title: decodeHtmlEntities(article.title.rendered),
        published_date: article.date,
        featured_image_url: article._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
      }));

      const releases: PreviewRelease[] = releasesData.map((song) => ({
        id: song.id,
        title: decodeHtmlEntities(song.title.rendered),
        artist: song.acf.artist_name,
        coverImage: song._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
        releaseDate: song.acf.release_date,
      }));

      setPreviewEvents(events);
      setPreviewArticles(articles);
      setPreviewReleases(releases);
    } catch (error) {
      console.log('Failed to fetch preview data:', error);
    }
  }

  function formatPreviewDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logo 192 (1).png')}
            style={styles.logo}
          />
          <View style={styles.liveIndicatorContainer}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.liveIndicatorText}>EN DIRECT</Text>
          </View>
        </View>

        <View style={styles.nowPlayingCard}>
          <View style={styles.nowPlayingContent}>
            <View style={styles.nowPlayingHeader}>
              <Animated.View style={animatedStyle}>
                <Image
                  source={resolveImageSource(metadata.coverImage || require('@/assets/images/logo 192 (1).png'))}
                  style={styles.nowPlayingCover}
                />
              </Animated.View>
              <View style={styles.nowPlayingInfo}>
                <Text style={styles.nowPlayingLabel}>En cours</Text>
                <Text style={styles.nowPlayingTitle} numberOfLines={2}>
                  {metadata.displayTitle}
                </Text>
                <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                  {metadata.displayArtist}
                </Text>
              </View>
            </View>

            <View style={styles.playButtonContainer}>
              <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
                <IconSymbol
                  ios_icon_name={isPlaying ? 'pause.fill' : 'play.fill'}
                  android_material_icon_name={isPlaying ? 'pause' : 'play-arrow'}
                  size={40}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.listenLiveButton} onPress={togglePlayback}>
          <LinearGradient
            colors={['#F7D21E', '#E5A800']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.listenLiveGradient}
          >
            <Text style={styles.listenLiveText}>
              {isPlaying ? '⏸️ Pause' : '▶️ Écouter en direct'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.shortcutsContainer}>
          <Text style={styles.sectionTitle}>Accès rapide</Text>
          <View style={styles.shortcutGrid}>
            <TouchableOpacity style={styles.shortcutCard} onPress={handleNavigateToNews}>
              <View style={styles.shortcutContent}>
                <IconSymbol
                  ios_icon_name="newspaper.fill"
                  android_material_icon_name="article"
                  size={32}
                  color={colors.accent}
                  style={styles.shortcutIcon}
                />
                <Text style={styles.shortcutText}>Actualités</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} onPress={handleNavigateToReleases}>
              <View style={styles.shortcutContent}>
                <IconSymbol
                  ios_icon_name="music.note"
                  android_material_icon_name="music-note"
                  size={32}
                  color={colors.accent}
                  style={styles.shortcutIcon}
                />
                <Text style={styles.shortcutText}>Nouveautés</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} onPress={handleNavigateToEvents}>
              <View style={styles.shortcutContent}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={32}
                  color={colors.accent}
                  style={styles.shortcutIcon}
                />
                <Text style={styles.shortcutText}>Événements</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {previewEvents.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Événements à venir</Text>
            {previewEvents.slice(0, 2).map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.previewCard}
                onPress={() => handleEventPress(event)}
              >
                {event.flyer_image && (
                  <Image
                    source={resolveImageSource(event.flyer_image)}
                    style={styles.previewImage}
                  />
                )}
                <View style={styles.previewContent}>
                  <Text style={styles.previewTitle}>{event.title}</Text>
                  <Text style={styles.previewMeta}>{event.event_location}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {previewArticles.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Dernières actualités</Text>
            {previewArticles.slice(0, 2).map((article) => (
              <TouchableOpacity
                key={article.id}
                style={styles.previewCard}
                onPress={() => handleNewsPress(article)}
              >
                {article.featured_image_url && (
                  <Image
                    source={resolveImageSource(article.featured_image_url)}
                    style={styles.previewImage}
                  />
                )}
                <View style={styles.previewContent}>
                  <Text style={styles.previewTitle}>{article.title}</Text>
                  <Text style={styles.previewMeta}>
                    {formatPreviewDate(article.published_date)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
