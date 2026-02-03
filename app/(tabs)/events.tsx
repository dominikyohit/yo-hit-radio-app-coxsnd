
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
  event_date: Date;
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

/**
 * Parse event date as UTC to avoid timezone shifting
 * Handles both "YYYYMMDD" format and natural language dates like "March 28, 2026"
 * CRITICAL: Treats all dates as date-only (no time component) to avoid timezone bugs
 */
function parseEventDateUTC(dateString: string | undefined): Date {
  if (!dateString) {
    console.log('[Events] Empty date string, returning epoch');
    return new Date(0);
  }

  // Handle YYYYMMDD format (8 digits)
  if (dateString.match(/^\d{8}$/)) {
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // Month is 0-indexed
    const day = parseInt(dateString.substring(6, 8), 10);
    
    // Create date as UTC to avoid timezone shifting
    const utcDate = new Date(Date.UTC(year, month, day));
    
    if (!isNaN(utcDate.getTime())) {
      console.log(`[Events] Parsed YYYYMMDD "${dateString}" to UTC: ${utcDate.toISOString()}`);
      return utcDate;
    }
  }

  // Handle natural language dates (e.g., "March 28, 2026")
  // Parse the string to extract year, month, day WITHOUT timezone interpretation
  const tempDate = new Date(dateString + ' UTC'); // Force UTC interpretation
  if (!isNaN(tempDate.getTime())) {
    // Extract date components from the UTC-parsed date
    const year = tempDate.getUTCFullYear();
    const month = tempDate.getUTCMonth();
    const day = tempDate.getUTCDate();
    const utcDate = new Date(Date.UTC(year, month, day));
    
    console.log(`[Events] Parsed natural date "${dateString}" to UTC: ${utcDate.toISOString()}`);
    return utcDate;
  }

  console.warn(`[Events] Could not parse date "${dateString}", returning epoch`);
  return new Date(0);
}

/**
 * Format date for display as "Month Day" (e.g., "Mar 28")
 * Uses UTC to avoid timezone shifting
 */
function formatDateBadgeUTC(date: Date): string {
  try {
    const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = date.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' });
    return `${month} ${day}`;
  } catch {
    return '';
  }
}

/**
 * Format date for display as "Month Day, Year" (e.g., "March 28, 2026")
 * Uses UTC to avoid timezone shifting
 */
function formatDateFullUTC(date: Date): string {
  try {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'UTC'
    });
  } catch {
    return '';
  }
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
      console.log('[Events] Fetching events from WordPress API (limit 20)...');
      
      // Fetch only first 20 events
      const response = await fetch('https://yohitradio.com/wp-json/wp/v2/bal?_embed&per_page=20');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: WordPressEvent[] = await response.json();
      console.log('[Events] Fetched raw events:', data.length);

      const processedEvents: Event[] = data
        .map((event) => {
          const eventDate = parseEventDateUTC(event.acf?.event_date);
          
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
        .sort((a, b) => {
          // Sort ascending (upcoming events first)
          return a.event_date.getTime() - b.event_date.getTime();
        });

      console.log('[Events] Processed and sorted events:', processedEvents.length);
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
              const dateBadgeText = formatDateBadgeUTC(event.event_date);
              const fullDateText = formatDateFullUTC(event.event_date);
              
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
