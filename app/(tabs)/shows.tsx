
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';

// WordPress API endpoint
const WORDPRESS_SCHEDULE_URL = 'https://yohitradio.com/wp-json/wp/v2/calendrier?per_page=100&_embed';

// Helper to resolve image sources
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
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

interface Show {
  id: number;
  day: string; // lowercase day name (e.g., "monday")
  title: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  timeRange: string;
  imageUrl: string | null;
  sortOrder: number;
}

interface DaySchedule {
  day: string; // Capitalized day name (e.g., "Monday")
  shows: Show[];
}

interface LiveShowInfo {
  onAirShowId: number | null;
  upNextShowId: number | null;
  upNextDay: string | null; // lowercase day name
}

// Day order for grouping
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// FlatList item types
type ScheduleItem = 
  | { type: 'header'; day: string; isToday: boolean }
  | { type: 'show'; show: Show; dayLowercase: string; isOnAir: boolean; isUpNext: boolean };

export default function ShowsScreen() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLiveInfo, setCurrentLiveInfo] = useState<LiveShowInfo>({
    onAirShowId: null,
    upNextShowId: null,
    upNextDay: null,
  });
  const [currentDayName, setCurrentDayName] = useState<string>('');
  const [hasScrolledToLive, setHasScrolledToLive] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  const fetchSchedule = useCallback(async () => {
    console.log('Fetching schedule from WordPress...');
    try {
      const response = await fetch(WORDPRESS_SCHEDULE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: WordPressScheduleItem[] = await response.json();
      console.log(`Fetched ${data.length} schedule items from WordPress`);

      // Parse and transform data
      const shows: Show[] = data.map((item) => {
        const acf = item.acf || {};
        const showTitle = acf.show_title || item.title.rendered || 'Untitled Show';
        const decodedTitle = decodeHtmlEntities(showTitle);
        const startTime = acf.start_time || '00:00';
        const endTime = acf.end_time || '00:00';
        const timeRange = `${startTime} - ${endTime}`;
        const sortOrder = acf.sort_order !== undefined ? acf.sort_order : 9999;
        const dayRaw = acf.day || 'unknown';
        const dayLowercase = dayRaw.toLowerCase().trim();

        // Extract featured image
        let imageUrl: string | null = null;
        if (item._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
          imageUrl = item._embedded['wp:featuredmedia'][0].source_url;
        }

        return {
          id: item.id,
          day: dayLowercase,
          title: decodedTitle,
          startTime,
          endTime,
          timeRange,
          imageUrl,
          sortOrder,
        };
      });

      // Group by day
      const grouped: { [key: string]: Show[] } = {};
      shows.forEach((show) => {
        const dayCapitalized = capitalizeDay(show.day);
        if (!grouped[dayCapitalized]) {
          grouped[dayCapitalized] = [];
        }
        grouped[dayCapitalized].push(show);
      });

      // Sort shows within each day
      Object.keys(grouped).forEach((day) => {
        grouped[day].sort((a, b) => {
          // Primary: sort_order ascending
          if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
          }
          // Fallback: start_time ascending (string compare)
          return a.startTime.localeCompare(b.startTime);
        });
      });

      // Get current day name
      const now = new Date();
      const currentDayIndex = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = daysOfWeek[currentDayIndex];
      setCurrentDayName(todayName.toLowerCase());

      // Create ordered schedule array starting with current day
      // Example: If today is Thursday, order is: Thursday, Friday, Saturday, Sunday, Monday, Tuesday, Wednesday
      const todayIndex = DAY_ORDER.indexOf(todayName);
      const reorderedDays: string[] = [];
      
      for (let i = 0; i < DAY_ORDER.length; i++) {
        const dayIndex = (todayIndex + i) % DAY_ORDER.length;
        reorderedDays.push(DAY_ORDER[dayIndex]);
      }

      const orderedSchedule: DaySchedule[] = reorderedDays
        .map((day) => ({
          day,
          shows: grouped[day] || [],
        }))
        .filter((daySchedule) => daySchedule.shows.length > 0);

      console.log('Schedule order:', orderedSchedule.map(ds => ds.day).join(', '));
      setSchedule(orderedSchedule);
      setError(null);
      console.log('Schedule loaded successfully');
    } catch (err) {
      console.error('Error fetching schedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schedule';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Determine ON AIR NOW and UP NEXT shows with cross-day support and midnight-spanning shows
  const getLiveShowInfo = useCallback((scheduleData: DaySchedule[]): LiveShowInfo => {
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = daysOfWeek[currentDayIndex];
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    console.log(`[LiveShowInfo] Current time: ${now.getHours()}:${now.getMinutes()} (${currentTimeMinutes} minutes), Day: ${currentDayName}`);

    let onAirShowId: number | null = null;
    let upNextShowId: number | null = null;
    let upNextDay: string | null = null;

    // Helper to convert time string to minutes
    const timeToMinutes = (timeStr: string): number => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    // Find current day's schedule
    const currentDaySchedule = scheduleData.find(
      (ds) => ds.day.toLowerCase() === currentDayName
    );

    // Check for shows spanning midnight from previous day
    const previousDayIndex = (currentDayIndex - 1 + 7) % 7;
    const previousDayName = daysOfWeek[previousDayIndex];
    const previousDaySchedule = scheduleData.find(
      (ds) => ds.day.toLowerCase() === previousDayName
    );

    // Check if a show from yesterday is still on air (spanning midnight)
    if (previousDaySchedule) {
      for (const show of previousDaySchedule.shows) {
        const showStartMinutes = timeToMinutes(show.startTime);
        const showEndMinutes = timeToMinutes(show.endTime);

        // Show spans midnight if end time < start time
        if (showEndMinutes < showStartMinutes) {
          // This show spans into today
          // It's on air if current time < end time
          if (currentTimeMinutes < showEndMinutes) {
            onAirShowId = show.id;
            console.log(`[LiveShowInfo] ON AIR NOW (from yesterday): ${show.title} (${show.startTime}-${show.endTime})`);
            
            // UP NEXT is the first show of today (if exists)
            if (currentDaySchedule && currentDaySchedule.shows.length > 0) {
              upNextShowId = currentDaySchedule.shows[0].id;
              upNextDay = currentDayName;
              console.log(`[LiveShowInfo] UP NEXT: ${currentDaySchedule.shows[0].title} (${currentDaySchedule.shows[0].startTime}-${currentDaySchedule.shows[0].endTime})`);
            }
            return { onAirShowId, upNextShowId, upNextDay };
          }
        }
      }
    }

    // Check today's shows
    if (currentDaySchedule) {
      const shows = currentDaySchedule.shows;

      for (let i = 0; i < shows.length; i++) {
        const show = shows[i];
        const showStartMinutes = timeToMinutes(show.startTime);
        let showEndMinutes = timeToMinutes(show.endTime);

        // Handle shows spanning midnight (e.g., 22:00-02:00)
        const spansMiddnight = showEndMinutes < showStartMinutes;
        if (spansMiddnight) {
          // Add 24 hours to end time for comparison
          showEndMinutes += 24 * 60;
        }

        // Check if current time is within [start, end)
        if (currentTimeMinutes >= showStartMinutes && currentTimeMinutes < showEndMinutes) {
          onAirShowId = show.id;
          console.log(`[LiveShowInfo] ON AIR NOW: ${show.title} (${show.startTime}-${show.endTime})`);
          
          // UP NEXT is the next show after this one
          if (i + 1 < shows.length) {
            upNextShowId = shows[i + 1].id;
            upNextDay = currentDayName;
            console.log(`[LiveShowInfo] UP NEXT: ${shows[i + 1].title} (${shows[i + 1].startTime}-${shows[i + 1].endTime})`);
          } else {
            // No more shows today, UP NEXT is first show of next day
            const nextDayIndex = (currentDayIndex + 1) % 7;
            const nextDayName = daysOfWeek[nextDayIndex];
            const nextDaySchedule = scheduleData.find(
              (ds) => ds.day.toLowerCase() === nextDayName
            );
            if (nextDaySchedule && nextDaySchedule.shows.length > 0) {
              upNextShowId = nextDaySchedule.shows[0].id;
              upNextDay = nextDayName;
              console.log(`[LiveShowInfo] UP NEXT (tomorrow): ${nextDaySchedule.shows[0].title} (${nextDaySchedule.shows[0].startTime}-${nextDaySchedule.shows[0].endTime})`);
            }
          }
          return { onAirShowId, upNextShowId, upNextDay };
        }
      }

      // No show is on air, find UP NEXT
      for (let i = 0; i < shows.length; i++) {
        const show = shows[i];
        const showStartMinutes = timeToMinutes(show.startTime);

        if (currentTimeMinutes < showStartMinutes) {
          // This is the next show
          upNextShowId = show.id;
          upNextDay = currentDayName;
          console.log(`[LiveShowInfo] UP NEXT (later today): ${show.title} (${show.startTime}-${show.endTime})`);
          return { onAirShowId, upNextShowId, upNextDay };
        }
      }
    }

    // Current time is after all shows today, UP NEXT is first show of next day
    let nextDayIndex = (currentDayIndex + 1) % 7;
    for (let i = 0; i < 7; i++) {
      const nextDayName = daysOfWeek[nextDayIndex];
      const nextDaySchedule = scheduleData.find(
        (ds) => ds.day.toLowerCase() === nextDayName
      );
      if (nextDaySchedule && nextDaySchedule.shows.length > 0) {
        upNextShowId = nextDaySchedule.shows[0].id;
        upNextDay = nextDayName;
        console.log(`[LiveShowInfo] UP NEXT (next available day): ${nextDaySchedule.shows[0].title} on ${nextDayName} (${nextDaySchedule.shows[0].startTime}-${nextDaySchedule.shows[0].endTime})`);
        break;
      }
      nextDayIndex = (nextDayIndex + 1) % 7;
    }

    return { onAirShowId, upNextShowId, upNextDay };
  }, []);

  // Auto-scroll to ON AIR NOW or UP NEXT show
  const scrollToLiveShow = useCallback(() => {
    if (!flatListRef.current || schedule.length === 0) {
      return;
    }

    const targetShowId = currentLiveInfo.onAirShowId || currentLiveInfo.upNextShowId;
    if (!targetShowId) {
      console.log('[AutoScroll] No live or upcoming show to scroll to');
      return;
    }

    // Build flat list of items to find the index
    const flatItems: ScheduleItem[] = [];
    schedule.forEach((daySchedule) => {
      const isToday = daySchedule.day.toLowerCase() === currentDayName;
      flatItems.push({ type: 'header', day: daySchedule.day, isToday });
      
      daySchedule.shows.forEach((show) => {
        const dayLowercase = daySchedule.day.toLowerCase();
        const isOnAir = show.id === currentLiveInfo.onAirShowId;
        const isUpNext = show.id === currentLiveInfo.upNextShowId && 
                         dayLowercase === currentLiveInfo.upNextDay;
        flatItems.push({ type: 'show', show, dayLowercase, isOnAir, isUpNext });
      });
    });

    // Find the index of the target show
    const targetIndex = flatItems.findIndex(
      (item) => item.type === 'show' && item.show.id === targetShowId
    );

    if (targetIndex !== -1) {
      console.log(`[AutoScroll] Scrolling to index ${targetIndex} (show ID: ${targetShowId})`);
      
      // Delay scroll to ensure FlatList is fully rendered
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: targetIndex,
            animated: true,
            viewPosition: 0.1, // Position near the top (10% from top)
          });
          setHasScrolledToLive(true);
        } catch (err) {
          console.error('[AutoScroll] Error scrolling to index:', err);
          // Fallback: scroll to offset
          flatListRef.current?.scrollToOffset({
            offset: targetIndex * 100, // Approximate offset
            animated: true,
          });
        }
      }, 300);
    } else {
      console.log('[AutoScroll] Target show not found in flat list');
    }
  }, [schedule, currentLiveInfo, currentDayName]);

  // Update live info periodically (every 30 seconds) and check for day change
  useEffect(() => {
    if (schedule.length > 0) {
      const updateLiveInfo = () => {
        const now = new Date();
        const currentDayIndex = now.getDay();
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayName = daysOfWeek[currentDayIndex];

        // Check if day has changed (midnight transition)
        if (todayName !== currentDayName) {
          console.log('Day changed from', currentDayName, 'to', todayName, '- refreshing schedule order');
          setCurrentDayName(todayName);
          setHasScrolledToLive(false); // Reset scroll flag on day change
          fetchSchedule(); // Refresh schedule to reorder days
        } else {
          // Update live show info
          const liveInfo = getLiveShowInfo(schedule);
          setCurrentLiveInfo(liveInfo);
        }
      };

      updateLiveInfo(); // Initial update
      const interval = setInterval(updateLiveInfo, 30 * 1000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [schedule, getLiveShowInfo, currentDayName, fetchSchedule]);

  // Auto-scroll when live info is available and we haven't scrolled yet
  useEffect(() => {
    if (schedule.length > 0 && !hasScrolledToLive && (currentLiveInfo.onAirShowId || currentLiveInfo.upNextShowId)) {
      console.log('[AutoScroll] Triggering auto-scroll to live/upcoming show');
      scrollToLiveShow();
    }
  }, [schedule, currentLiveInfo, hasScrolledToLive, scrollToLiveShow]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const onRefresh = useCallback(() => {
    console.log('User initiated refresh');
    setRefreshing(true);
    setHasScrolledToLive(false); // Reset scroll flag on manual refresh
    fetchSchedule();
  }, [fetchSchedule]);

  // Capitalize day name
  const capitalizeDay = (day: string): string => {
    const normalized = day.toLowerCase().trim();
    const dayMap: { [key: string]: string } = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };
    return dayMap[normalized] || day;
  };

  // Prepare flat list data
  const flatListData: ScheduleItem[] = [];
  schedule.forEach((daySchedule) => {
    const isToday = daySchedule.day.toLowerCase() === currentDayName;
    flatListData.push({ type: 'header', day: daySchedule.day, isToday });
    
    daySchedule.shows.forEach((show) => {
      const dayLowercase = daySchedule.day.toLowerCase();
      const isOnAir = show.id === currentLiveInfo.onAirShowId;
      const isUpNext = show.id === currentLiveInfo.upNextShowId && 
                       dayLowercase === currentLiveInfo.upNextDay;
      flatListData.push({ type: 'show', show, dayLowercase, isOnAir, isUpNext });
    });
  });

  const renderItem = ({ item }: { item: ScheduleItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>{item.day}</Text>
          {item.isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>TODAY</Text>
            </View>
          )}
        </View>
      );
    } else {
      const { show, isOnAir, isUpNext } = item;
      
      return (
        <View
          style={[
            styles.showCard,
            isOnAir && styles.showCardOnAir,
            isUpNext && !isOnAir && styles.showCardUpNext,
          ]}
        >
          <View style={styles.showImageContainer}>
            {show.imageUrl ? (
              <Image
                source={resolveImageSource(show.imageUrl)}
                style={styles.showImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.showImagePlaceholder}>
                <IconSymbol
                  ios_icon_name="music.note"
                  android_material_icon_name="music-note"
                  size={24}
                  color="#FFD700"
                />
              </View>
            )}
          </View>

          <View style={styles.showInfo}>
            <View style={styles.showTitleRow}>
              <Text style={styles.showTitle} numberOfLines={2}>
                {show.title}
              </Text>
              {isOnAir && (
                <View style={styles.badgeOnAir}>
                  <Text style={styles.badgeText}>ON AIR NOW</Text>
                </View>
              )}
              {isUpNext && !isOnAir && (
                <View style={styles.badgeUpNext}>
                  <Text style={styles.badgeText}>UP NEXT</Text>
                </View>
              )}
            </View>
            <View style={styles.timeRow}>
              <IconSymbol
                ios_icon_name="clock"
                android_material_icon_name="access-time"
                size={14}
                color="#B8B8B8"
              />
              <Text style={styles.timeText}>{show.timeRange}</Text>
            </View>
          </View>
        </View>
      );
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <IconSymbol
        ios_icon_name="calendar"
        android_material_icon_name="calendar-today"
        size={32}
        color="#FFD700"
      />
      <Text style={styles.title}>Programming Schedule</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol
        ios_icon_name="calendar"
        android_material_icon_name="calendar-today"
        size={48}
        color="#B8B8B8"
      />
      <Text style={styles.emptyText}>No shows scheduled</Text>
    </View>
  );

  const renderFooter = () => <View style={styles.footer} />;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient
          colors={['#1a0033', '#2d1b4e', '#1a0033']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient
          colors={['#1a0033', '#2d1b4e', '#1a0033']}
          style={styles.gradient}
        >
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <View style={styles.errorContainer}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle"
                  android_material_icon_name="error"
                  size={48}
                  color="#FFD700"
                />
                <Text style={styles.errorTitle}>Unable to Load Schedule</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <Text style={styles.errorHint}>Pull down to retry</Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFD700"
                colors={['#FFD700']}
              />
            }
            contentContainerStyle={styles.contentContainer}
          />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#1a0033', '#2d1b4e', '#1a0033']}
        style={styles.gradient}
      >
        <FlatList
          ref={flatListRef}
          data={flatListData}
          renderItem={renderItem}
          keyExtractor={(item, index) => 
            item.type === 'header' ? `header-${item.day}` : `show-${item.show.id}-${index}`
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
              colors={['#FFD700']}
            />
          }
          onScrollToIndexFailed={(info) => {
            console.warn('[AutoScroll] scrollToIndex failed:', info);
            // Fallback: scroll to offset
            setTimeout(() => {
              flatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
            }, 100);
          }}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a0033',
  },
  gradient: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
    gap: 10,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFD700',
  },
  todayBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1a0033',
    letterSpacing: 0.5,
  },
  showCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  showCardOnAir: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  showCardUpNext: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.6)',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  showImageContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  showImage: {
    width: '100%',
    height: '100%',
  },
  showImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  showInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  showTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  showTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgeOnAir: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeUpNext: {
    backgroundColor: 'rgba(255, 215, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1a0033',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B8B8B8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#B8B8B8',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
    minHeight: 400,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#B8B8B8',
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#B8B8B8',
    textAlign: 'center',
  },
  footer: {
    height: 20,
  },
});
