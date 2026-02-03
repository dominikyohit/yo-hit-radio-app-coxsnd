
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import { parseEventDate, formatDateBadge, formatDateFull } from '@/utils/dateHelpers';

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

interface Event {
  id: string;
  title: string;
  event_date_raw: string;
  event_date: Date | null;
  event_location: string;
  event_price: string;
  event_artists: string;
  ticket_link: string;
  flyer_image: string | null;
}

// Helper to resolve image sources (handles both local and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[Events] Fetching events from WordPress API...');
      
      // Fetch events from API
      const response = await fetch('https://yohitradio.com/wp-json/wp/v2/bal?_embed&per_page=100');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: WordPressEvent[] = await response.json();
      console.log('[Events] Fetched raw events:', data.length);

      // Get today's date at midnight for comparison (local date, no time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('[Events] Today (local):', today.toDateString());

      // Process, filter, and sort events
      const processedEvents: Event[] = data
        .map((event) => {
          const eventDate = parseEventDate(event.acf?.event_date);
          
          return {
            id: String(event.id),
            title: event.title.rendered,
            event_date_raw: event.acf?.event_date || '',
            event_date: eventDate,
            event_location: event.acf?.event_location || '',
            event_price: event.acf?.event_price || '',
            event_artists: event.acf?.event_artists || '',
            ticket_link: event.acf?.ticket_link || '',
            flyer_image: event._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          };
        })
        .filter((event) => {
          // Keep only upcoming events (event_date >= today)
          if (!event.event_date) {
            console.log('[Events] Filtering out event with invalid date:', event.title);
            return false;
          }
          
          // Normalize event date to midnight for comparison
          const eventDateNormalized = new Date(event.event_date);
          eventDateNormalized.setHours(0, 0, 0, 0);
          
          const isUpcoming = eventDateNormalized >= today;
          if (!isUpcoming) {
            console.log('[Events] Filtering out past event:', event.title, eventDateNormalized.toDateString());
          }
          return isUpcoming;
        })
        .sort((a, b) => {
          // Sort ascending by date (upcoming events first)
          const timeA = a.event_date?.getTime() || 0;
          const timeB = b.event_date?.getTime() || 0;
          return timeA - timeB;
        })
        .slice(0, 20); // Show only first 20 upcoming events

      console.log('[Events] Processed, filtered, and sorted events:', processedEvents.length);
      setEvents(processedEvents);
    } catch (err) {
      console.error('[Events] Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventPress = (event: Event) => {
    console.log('[Events] Opening event details:', event.id);
    router.push({
      pathname: '/event-details',
      params: {
        id: event.id,
        title: event.title,
        event_date_raw: event.event_date_raw,
        event_location: event.event_location,
        event_price: event.event_price,
        event_artists: event.event_artists,
        ticket_link: event.ticket_link,
        flyer_image: event.flyer_image || '',
      },
    });
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.card, colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events</Text>
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="event"
            size={28}
            color={colors.accent}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle"
              android_material_icon_name="error"
              size={48}
              color={colors.highlight}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No upcoming events</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {events.map((event, index) => {
              const dateBadgeText = formatDateBadge(event.event_date);
              const fullDateText = formatDateFull(event.event_date);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.eventCard}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.8}
                >
                  {event.flyer_image && (
                    <View style={styles.imageContainer}>
                      <Image
                        source={resolveImageSource(event.flyer_image)}
                        style={styles.flyerImage}
                        resizeMode="cover"
                      />
                      <View style={styles.badgesContainer}>
                        {dateBadgeText && (
                          <View style={styles.dateBadge}>
                            <Text style={styles.dateBadgeText}>{dateBadgeText}</Text>
                          </View>
                        )}
                        {event.event_price && (
                          <View style={styles.priceBadge}>
                            <Text style={styles.priceBadgeText}>{event.event_price}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {event.title}
                    </Text>
                    
                    {event.event_artists && (
                      <View style={styles.eventDetail}>
                        <IconSymbol
                          ios_icon_name="music.note"
                          android_material_icon_name="music-note"
                          size={16}
                          color={colors.accent}
                        />
                        <Text style={styles.eventDetailText} numberOfLines={2}>
                          {event.event_artists}
                        </Text>
                      </View>
                    )}
                    
                    {fullDateText && (
                      <View style={styles.eventDetail}>
                        <IconSymbol
                          ios_icon_name="calendar"
                          android_material_icon_name="calendar-today"
                          size={16}
                          color={colors.accent}
                        />
                        <Text style={styles.eventDetailText}>
                          {fullDateText}
                        </Text>
                      </View>
                    )}
                    
                    {event.event_location && (
                      <View style={styles.eventDetail}>
                        <IconSymbol
                          ios_icon_name="location"
                          android_material_icon_name="location-on"
                          size={16}
                          color={colors.accent}
                        />
                        <Text style={styles.eventDetailText} numberOfLines={1}>
                          {event.event_location}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.eventFooter}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                      <IconSymbol
                        ios_icon_name="chevron.right"
                        android_material_icon_name="chevron-right"
                        size={20}
                        color={colors.accent}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
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
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  eventCard: {
    backgroundColor: 'rgba(45, 27, 78, 0.8)',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 240,
  },
  flyerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.card,
  },
  badgesContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)',
    elevation: 3,
  },
  dateBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background,
  },
  priceBadge: {
    backgroundColor: 'rgba(107, 70, 193, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)',
    elevation: 3,
  },
  priceBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 28,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});
