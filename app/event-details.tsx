
import { colors } from '@/styles/commonStyles';
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
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';
import { LinearGradient } from 'expo-linear-gradient';
import { parseEventDate, formatDateFull } from '@/utils/dateHelpers';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  flyerImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.cardBackground,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  artistsText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 30,
  },
  button: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function EventDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const eventId = params.eventId as string;
  const initialTitle = params.title as string;
  const initialEventDateRaw = params.event_date_raw as string;
  const initialEventLocation = params.event_location as string;
  const initialFlyerImage = params.flyer_image as string;
  const initialTicketLink = params.ticket_link as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(
          `https://yohitradio.com/wp-json/wp/v2/events/${eventId}?_embed`
        );
        const data: WordPressEvent = await response.json();

        const eventData: EventData = {
          id: String(data.id),
          title: decodeHtmlEntities(data.title.rendered),
          event_date_raw: data.acf.event_date,
          event_location: data.acf.event_location,
          event_price: data.acf.event_price,
          event_artists: data.acf.event_artists,
          ticket_link: data.acf.ticket_link,
          flyer_image: data._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
        };

        setEvent(eventData);
      } catch (error) {
        console.error('Failed to fetch event:', error);
        setEvent({
          id: eventId,
          title: initialTitle || 'Événement',
          event_date_raw: initialEventDateRaw || '',
          event_location: initialEventLocation || '',
          event_price: '',
          event_artists: '',
          ticket_link: initialTicketLink || '',
          flyer_image: initialFlyerImage || '',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, initialTitle, initialEventDateRaw, initialEventLocation, initialFlyerImage, initialTicketLink]);

  function handleBuyTicket() {
    if (event?.ticket_link) {
      console.log('User tapped Buy Ticket button');
      Linking.openURL(event.ticket_link);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Événement introuvable</Text>
      </View>
    );
  }

  const eventDate = parseEventDate(event.event_date_raw);
  const formattedDate = eventDate ? formatDateFull(eventDate) : event.event_date_raw;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Détails de l\'événement',
          headerShown: true,
          headerBackTitle: 'Retour',
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {event.flyer_image && (
          <Image
            source={resolveImageSource(event.flyer_image)}
            style={styles.flyerImage}
          />
        )}

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={24}
              color={colors.accent}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{formattedDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="place"
              size={24}
              color={colors.accent}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{event.event_location}</Text>
          </View>

          {event.event_price && (
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="tag.fill"
                android_material_icon_name="local-offer"
                size={24}
                color={colors.accent}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>{event.event_price}</Text>
            </View>
          )}

          {event.event_artists && (
            <>
              <Text style={styles.sectionTitle}>Artistes</Text>
              <Text style={styles.artistsText}>{event.event_artists}</Text>
            </>
          )}

          <View style={styles.buttonContainer}>
            {event.ticket_link && (
              <TouchableOpacity style={styles.button} onPress={handleBuyTicket}>
                <LinearGradient
                  colors={['#F7D21E', '#E5A800']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Acheter des billets</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
