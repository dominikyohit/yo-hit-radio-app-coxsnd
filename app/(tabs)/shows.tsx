
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  ImageSourcePropType,
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
    'wp:featuredmedia'?: Array<{
      source_url?: string;
    }>;
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

  // Determine ON AIR NOW and UP NEXT shows (only for current day)
  const getLiveShowInfo = useCallback((scheduleData: DaySchedule[]): LiveShowInfo => {
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = daysOfWeek[currentDayIndex];
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    let onAirShowId: number | null = null;
    let upNextShowId: number | null = null;
    let upNextDay: string | null = null;

    // Find current day's schedule
    const currentDaySchedule = scheduleData.find(
      (ds) => ds.day.toLowerCase() === currentDayName
    );

    if (currentDaySchedule) {
      const shows = currentDaySchedule.shows;

      for (let i = 0; i < shows.length; i++) {
        const show = shows[i];
        const [startH, startM] = show.startTime.split(':').map(Number);
        const [endH, endM] = show.endTime.split(':').map(Number);
        const showStartMinutes = startH * 60 + startM;
        const showEndMinutes = endH * 60 + endM;

        // Check if current time is within [start, end)
        if (currentTimeMinutes >= showStartMinutes && currentTimeMinutes < showEndMinutes) {
          onAirShowId = show.id;
          // Next show is the one after current (if exists)
          if (i + 1 < shows.length) {
            upNextShowId = shows[i + 1].id;
            upNextDay = currentDayName;
          }
          break;
        } else if (currentTimeMinutes < showStartMinutes && !upNextShowId) {
          // Current time is before this show, and we haven't found UP NEXT yet
          upNextShowId = show.id;
          upNextDay = currentDayName;
          break;
        }
      }
    }

    // Edge case: If current time is after the last show of the day, UP NEXT is first show of next day
    if (!onAirShowId && !upNextShowId) {
      let nextDayIndex = (currentDayIndex + 1) % 7;
      for (let i = 0; i < 7; i++) {
        const nextDayName = daysOfWeek[nextDayIndex];
        const nextDaySchedule = scheduleData.find(
          (ds) => ds.day.toLowerCase() === nextDayName
        );
        if (nextDaySchedule && nextDaySchedule.shows.length > 0) {
          upNextShowId = nextDaySchedule.shows[0].id;
          upNextDay = nextDayName;
          break;
        }
        nextDayIndex = (nextDayIndex + 1) % 7;
      }
    }

    return { onAirShowId, upNextShowId, upNextDay };
  }, []);

  // Update live info periodically and check for day change
  useEffect(() => {
    if (schedule.length > 0) {
      const updateLiveInfo = () => {
        const now = new Date();
        const currentDayIndex = now.getDay();
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayName = daysOfWeek[currentDayIndex];

        // Check if day has changed
        if (todayName !== currentDayName) {
          console.log('Day changed from', currentDayName, 'to', todayName, '- refreshing schedule order');
          setCurrentDayName(todayName);
          fetchSchedule(); // Refresh schedule to reorder days
        } else {
          // Update live show info
          const liveInfo = getLiveShowInfo(schedule);
          setCurrentLiveInfo(liveInfo);
        }
      };

      updateLiveInfo(); // Initial update
      const interval = setInterval(updateLiveInfo, 60 * 1000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [schedule, getLiveShowInfo, currentDayName, fetchSchedule]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const onRefresh = useCallback(() => {
    console.log('User initiated refresh');
    setRefreshing(true);
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
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.errorContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFD700"
                colors={['#FFD700']}
              />
            }
          >
            <IconSymbol
              ios_icon_name="exclamationmark.triangle"
              android_material_icon_name="error"
              size={48}
              color="#FFD700"
            />
            <Text style={styles.errorTitle}>Unable to Load Schedule</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Text style={styles.errorHint}>Pull down to retry</Text>
          </ScrollView>
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
        <ScrollView
          style={styles.container}
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
        >
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={32}
              color="#FFD700"
            />
            <Text style={styles.title}>Programming Schedule</Text>
          </View>

          {schedule.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={48}
                color="#B8B8B8"
              />
              <Text style={styles.emptyText}>No shows scheduled</Text>
            </View>
          ) : (
            schedule.map((daySchedule, dayIndex) => {
              const isCurrentDay = daySchedule.day.toLowerCase() === currentDayName;

              return (
                <View key={dayIndex} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{daySchedule.day}</Text>
                    {isCurrentDay && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>TODAY</Text>
                      </View>
                    )}
                  </View>

                  {daySchedule.shows.map((show, showIndex) => {
                    // Only show badges for current day
                    const isOnAir = isCurrentDay && show.id === currentLiveInfo.onAirShowId;
                    const isUpNext = isCurrentDay && show.id === currentLiveInfo.upNextShowId;

                    return (
                      <View
                        key={showIndex}
                        style={[
                          styles.showCard,
                          isOnAir && styles.showCardOnAir,
                          isUpNext && styles.showCardUpNext,
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
                  })}
                </View>
              );
            })
          )}

          <View style={styles.footer} />
        </ScrollView>
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
  container: {
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
  daySection: {
    marginBottom: 28,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
