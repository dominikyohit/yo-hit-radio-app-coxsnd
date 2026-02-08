
import { colors } from '@/styles/commonStyles';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ImageSourcePropType,
  Image,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';
import { LinearGradient } from 'expo-linear-gradient';

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

interface Show {
  id: number;
  day: string;
  title: string;
  startTime: string;
  endTime: string;
  timeRange: string;
  imageUrl: string | null;
  sortOrder: number;
}

interface DaySchedule {
  day: string;
  shows: Show[];
}

interface LiveShowInfo {
  onAirShowId: number | null;
  upNextShowId: number | null;
  upNextDay: string | null;
}

type ScheduleItem = { type: 'day'; day: string } | { type: 'show'; show: Show };

const WORDPRESS_SCHEDULE_URL = 'https://yohitradio.com/wp-json/wp/v2/schedule?_embed&per_page=100';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  dayHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  showCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  showCardOnAir: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  showCardUpNext: {
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  showContent: {
    flexDirection: 'row',
    padding: 15,
  },
  showImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: colors.cardBackground,
  },
  showInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  showTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  showTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  upNextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  upNextIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footerContainer: {
    paddingVertical: 20,
  },
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function ShowsScreen() {
  const flatListRef = useRef<FlatList>(null);

  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLiveInfo, setCurrentLiveInfo] = useState<LiveShowInfo>({
    onAirShowId: null,
    upNextShowId: null,
    upNextDay: null,
  });
  const [hasScrolledToLive, setHasScrolledToLive] = useState(false);

  const fetchSchedule = useCallback(async () => {
    try {
      const response = await fetch(WORDPRESS_SCHEDULE_URL);
      const data: WordPressScheduleItem[] = await response.json();

      const parsedShows: Show[] = data
        .map((item) => ({
          id: item.id,
          day: item.acf?.day || '',
          title: decodeHtmlEntities(item.acf?.show_title || item.title.rendered),
          startTime: item.acf?.start_time || '',
          endTime: item.acf?.end_time || '',
          timeRange: `${item.acf?.start_time || ''} - ${item.acf?.end_time || ''}`,
          imageUrl: item._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          sortOrder: item.acf?.sort_order || 0,
        }))
        .filter((show) => show.day && show.startTime && show.endTime);

      const groupedByDay: { [key: string]: Show[] } = {};
      parsedShows.forEach((show) => {
        if (!groupedByDay[show.day]) {
          groupedByDay[show.day] = [];
        }
        groupedByDay[show.day].push(show);
      });

      const sortedSchedule: DaySchedule[] = DAY_ORDER.map((day) => ({
        day,
        shows: (groupedByDay[day] || []).sort((a, b) => a.sortOrder - b.sortOrder),
      })).filter((daySchedule) => daySchedule.shows.length > 0);

      setSchedule(sortedSchedule);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const getLiveShowInfo = useCallback((): LiveShowInfo => {
    const now = new Date();
    const currentDayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todaySchedule = schedule.find((s) => s.day === currentDayName);
    if (!todaySchedule) {
      return { onAirShowId: null, upNextShowId: null, upNextDay: null };
    }

    let onAirShowId: number | null = null;
    let upNextShowId: number | null = null;
    let upNextDay: string | null = null;

    for (let i = 0; i < todaySchedule.shows.length; i++) {
      const show = todaySchedule.shows[i];
      const [startHour, startMin] = show.startTime.split(':').map(Number);
      const [endHour, endMin] = show.endTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (currentTime >= startTime && currentTime < endTime) {
        onAirShowId = show.id;
        if (i + 1 < todaySchedule.shows.length) {
          upNextShowId = todaySchedule.shows[i + 1].id;
          upNextDay = currentDayName;
        }
        break;
      }

      if (currentTime < startTime && !upNextShowId) {
        upNextShowId = show.id;
        upNextDay = currentDayName;
        break;
      }
    }

    return { onAirShowId, upNextShowId, upNextDay };
  }, [schedule]);

  const scrollToLiveShow = useCallback(() => {
    if (hasScrolledToLive || !flatListRef.current || schedule.length === 0) return;

    const liveInfo = getLiveShowInfo();
    if (!liveInfo.onAirShowId && !liveInfo.upNextShowId) return;

    const targetShowId = liveInfo.onAirShowId || liveInfo.upNextShowId;
    const flatData: ScheduleItem[] = [];
    schedule.forEach((daySchedule) => {
      flatData.push({ type: 'day', day: daySchedule.day });
      daySchedule.shows.forEach((show) => {
        flatData.push({ type: 'show', show });
      });
    });

    const targetIndex = flatData.findIndex(
      (item) => item.type === 'show' && item.show.id === targetShowId
    );

    if (targetIndex !== -1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0.2,
        });
        setHasScrolledToLive(true);
      }, 500);
    }
  }, [schedule, hasScrolledToLive, getLiveShowInfo]);

  useEffect(() => {
    scrollToLiveShow();
  }, [schedule, currentLiveInfo, hasScrolledToLive, scrollToLiveShow]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasScrolledToLive(false);
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    const updateLiveInfo = () => {
      setCurrentLiveInfo(getLiveShowInfo());
    };

    updateLiveInfo();
    const interval = setInterval(updateLiveInfo, 60000);

    return () => clearInterval(interval);
  }, [schedule, getLiveShowInfo]);

  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  function capitalizeDay(day: string): string {
    const dayMap: { [key: string]: string } = {
      Monday: 'Lundi',
      Tuesday: 'Mardi',
      Wednesday: 'Mercredi',
      Thursday: 'Jeudi',
      Friday: 'Vendredi',
      Saturday: 'Samedi',
      Sunday: 'Dimanche',
    };
    return dayMap[day] || day;
  }

  const flatData: ScheduleItem[] = [];
  schedule.forEach((daySchedule) => {
    flatData.push({ type: 'day', day: daySchedule.day });
    daySchedule.shows.forEach((show) => {
      flatData.push({ type: 'show', show });
    });
  });

  function renderItem({ item }: { item: ScheduleItem }) {
    if (item.type === 'day') {
      return (
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{capitalizeDay(item.day)}</Text>
        </View>
      );
    }

    const show = item.show;
    const isOnAir = currentLiveInfo.onAirShowId === show.id;
    const isUpNext = currentLiveInfo.upNextShowId === show.id;

    return (
      <View
        style={[
          styles.showCard,
          isOnAir && styles.showCardOnAir,
          isUpNext && styles.showCardUpNext,
        ]}
      >
        <View style={styles.showContent}>
          {show.imageUrl && (
            <Image
              source={resolveImageSource(show.imageUrl)}
              style={styles.showImage}
            />
          )}
          <View style={styles.showInfo}>
            <Text style={styles.showTitle}>{show.title}</Text>
            <Text style={styles.showTime}>{show.timeRange}</Text>
            {isOnAir && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.liveIndicatorText}>EN DIRECT</Text>
              </View>
            )}
            {isUpNext && !isOnAir && (
              <View style={styles.upNextIndicator}>
                <Text style={styles.upNextIndicatorText}>À SUIVRE</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  function renderHeader() {
    return null;
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune émission disponible</Text>
      </View>
    );
  }

  function renderFooter() {
    return <View style={styles.footerContainer} />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Chargement de la grille...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        ref={flatListRef}
        data={flatData}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.type === 'day' ? `day-${item.day}` : `show-${item.show.id}`
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        onScrollToIndexFailed={(info) => {
          console.log('Scroll to index failed:', info);
        }}
      />
    </SafeAreaView>
  );
}
