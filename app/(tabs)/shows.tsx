
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

// Day order for grouping
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ShowsScreen() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

        // Extract featured image
        let imageUrl: string | null = null;
        if (item._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
          imageUrl = item._embedded['wp:featuredmedia'][0].source_url;
        }

        return {
          id: item.id,
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
        const dayRaw = show.id ? data.find(d => d.id === show.id)?.acf?.day : undefined;
        const day = dayRaw ? capitalizeDay(dayRaw) : 'Unknown';
        if (!grouped[day]) {
          grouped[day] = [];
        }
        grouped[day].push(show);
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

      // Create ordered schedule array
      const orderedSchedule: DaySchedule[] = DAY_ORDER.map((day) => ({
        day,
        shows: grouped[day] || [],
      })).filter((daySchedule) => daySchedule.shows.length > 0);

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
            schedule.map((daySchedule, dayIndex) => (
              <View key={dayIndex} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{daySchedule.day}</Text>
                </View>

                {daySchedule.shows.map((show, showIndex) => (
                  <View key={showIndex} style={styles.showCard}>
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
                            size={28}
                            color="#FFD700"
                          />
                        </View>
                      )}
                    </View>

                    <View style={styles.showInfo}>
                      <Text style={styles.showTitle} numberOfLines={2}>
                        {show.title}
                      </Text>
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
                ))}
              </View>
            ))
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
    marginBottom: 24,
  },
  dayHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFD700',
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
  showImageContainer: {
    width: 66,
    height: 66,
    borderRadius: 14,
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
  showTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
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
