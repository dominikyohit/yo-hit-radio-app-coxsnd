
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { parseEventDate, formatDateFull } from '@/utils/dateHelpers';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';

// Helper to resolve image sources (handles both local and remote URLs)
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
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

interface EventData {
  id: string;
  title: string;
  event_date_raw: string;
  event_location: string;
  event_price: string;
  event_artists: string;
  ticket_link: string;
  flyer_image: string;
}

export default function EventDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const eventId = String(params.id || '');
  const initialTicketLink = String(params.ticket_link || '');
  
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch full event data if ticket_link is missing
  useEffect(() => {
    const fetchFullEventData = async () => {
      // If ticket_link is already present in params, use params data directly
      if (initialTicketLink) {
        console.log('[EventDetails] ticket_link present in params, using params data');
        setEventData({
          id: eventId,
          title: String(params.title || ''),
          event_date_raw: String(params.event_date_raw || ''),
          event_location: String(params.event_location || ''),
          event_price: String(params.event_price || ''),
          event_artists: String(params.event_artists || ''),
          ticket_link: initialTicketLink,
          flyer_image: String(params.flyer_image || ''),
        });
        return;
      }

      // ticket_link is missing, fetch full event data by ID
      if (!eventId) {
        console.error('[EventDetails] No event ID provided');
        setError('Event ID is missing');
        return;
      }

      console.log('[EventDetails] ticket_link missing, fetching full event data by ID:', eventId);
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://yohitradio.com/wp-json/wp/v2/bal/${eventId}?_embed`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch event: ${response.status}`);
        }

        const data: WordPressEvent = await response.json();
        console.log('[EventDetails] Fetched full event data:', data);

        const fullEventData: EventData = {
          id: String(data.id),
          title: decodeHtmlEntities(data.title.rendered),
          event_date_raw: data.acf?.event_date || '',
          event_location: data.acf?.event_location || '',
          event_price: data.acf?.event_price || '',
          event_artists: data.acf?.event_artists || '',
          ticket_link: data.acf?.ticket_link || '',
          flyer_image: data._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
        };

        console.log('[EventDetails] Processed event data with ticket_link:', fullEventData.ticket_link);
        setEventData(fullEventData);
      } catch (err) {
        console.error('[EventDetails] Error fetching full event data:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchFullEventData();
  }, [eventId, initialTicketLink, params.title, params.event_date_raw, params.event_location, params.event_price, params.event_artists, params.flyer_image]);

  const handleBuyTicket = async () => {
    const ticketUrl = eventData?.ticket_link;
    
    if (!ticketUrl) {
      console.log('[EventDetails] No ticket link available');
      return;
    }
    
    try {
      console.log('[EventDetails] Opening ticket link:', ticketUrl);
      const canOpen = await Linking.canOpenURL(ticketUrl);
      if (canOpen) {
        await Linking.openURL(ticketUrl);
      } else {
        console.error('[EventDetails] Cannot open URL:', ticketUrl);
      }
    } catch (error) {
      console.error('[EventDetails] Error opening ticket link:', error);
    }
  };

  // Parse event data for display - ATOMIC JSX RULES
  const titleRaw = eventData?.title || String(params.title || '');
  const title = decodeHtmlEntities(titleRaw);
  const eventDateRaw = eventData?.event_date_raw || String(params.event_date_raw || '');
  const eventLocation = eventData?.event_location || String(params.event_location || '');
  const eventPrice = eventData?.event_price || String(params.event_price || '');
  const eventArtists = eventData?.event_artists || String(params.event_artists || '');
  const ticketLink = eventData?.ticket_link || '';
  const flyerImage = eventData?.flyer_image || String(params.flyer_image || '');
  
  const eventDate = parseEventDate(eventDateRaw);
  const formattedDate = formatDateFull(eventDate);

  // Show loading state while fetching
  if (loading) {
    return (
      <React.Fragment>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <LinearGradient
          colors={[colors.background, colors.card, colors.background]}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol
                  ios_icon_name="chevron.left"
                  android_material_icon_name="arrow-back"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Loading event details...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </React.Fragment>
    );
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <React.Fragment>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <LinearGradient
          colors={[colors.background, colors.card, colors.background]}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol
                  ios_icon_name="chevron.left"
                  android_material_icon_name="arrow-back"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.loadingContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle"
                android_material_icon_name="error"
                size={48}
                color={colors.highlight}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <LinearGradient
        colors={[colors.background, colors.card, colors.background]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow-back"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {flyerImage && (
              <Image
                source={resolveImageSource(flyerImage)}
                style={styles.flyerImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.contentContainer}>
              <Text style={styles.title}>{title}</Text>

              {eventArtists && (
                <View style={styles.artistsContainer}>
                  <IconSymbol
                    ios_icon_name="music.note"
                    android_material_icon_name="music-note"
                    size={20}
                    color={colors.accent}
                  />
                  <Text style={styles.artistsText}>{eventArtists}</Text>
                </View>
              )}

              <View style={styles.detailsCard}>
                {formattedDate && (
                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="calendar-today"
                      size={20}
                      color={colors.accent}
                    />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>{formattedDate}</Text>
                    </View>
                  </View>
                )}

                {eventLocation && (
                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="location"
                      android_material_icon_name="location-on"
                      size={20}
                      color={colors.accent}
                    />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>{eventLocation}</Text>
                    </View>
                  </View>
                )}

                {eventPrice && (
                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="ticket"
                      android_material_icon_name="confirmation-number"
                      size={20}
                      color={colors.accent}
                    />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Price</Text>
                      <Text style={styles.detailValue}>{eventPrice}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {ticketLink && (
            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity
                style={styles.buyTicketButton}
                onPress={handleBuyTicket}
                activeOpacity={0.8}
              >
                <Text style={styles.buyTicketButtonText}>Buy Ticket</Text>
                <IconSymbol
                  ios_icon_name="arrow.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.background}
                />
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </React.Fragment>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 27, 78, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.3)',
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  flyerImage: {
    width: '100%',
    height: 400,
    backgroundColor: colors.card,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    lineHeight: 36,
  },
  artistsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(107, 70, 193, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  artistsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  detailsCard: {
    backgroundColor: 'rgba(45, 27, 78, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  buyTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    boxShadow: '0px 4px 12px rgba(251, 191, 36, 0.4)',
    elevation: 4,
  },
  buyTicketButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background,
    marginRight: 8,
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
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});
