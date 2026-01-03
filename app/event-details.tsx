
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { apiGet } from '@/utils/api';

interface Event {
  id: string;
  title: string;
  description: string;
  flyer_image_url: string | null;
  event_date: string;
  location: string;
  ticket_url: string | null;
  created_at: string;
}

export default function EventDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[EventDetails] Fetching event:', id);
      const data = await apiGet<Event>(`/api/events/${id}`);
      console.log('[EventDetails] Fetched event:', data);
      setEvent(data);
    } catch (err) {
      console.error('[EventDetails] Error fetching event:', err);
      setError('Failed to load event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const handleAddToCalendar = () => {
    Alert.alert(
      'Add to Calendar',
      'This feature would integrate with your device calendar to add this event.',
      [{ text: 'OK' }]
    );
  };

  const handleGetTickets = async () => {
    if (!event?.ticket_url) {
      Alert.alert('No Tickets', 'Ticket information is not available for this event.');
      return;
    }
    
    try {
      const url = event.ticket_url;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open ticket link');
      }
    } catch (error) {
      console.error('Error opening ticket link:', error);
      Alert.alert('Error', 'Unable to open ticket link');
    }
  };

  return (
    <>
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

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Loading event...</Text>
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
              <TouchableOpacity style={styles.retryButton} onPress={fetchEvent}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : event ? (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {event.flyer_image_url && (
                <Image
                  source={{ uri: event.flyer_image_url }}
                  style={styles.flyerImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.contentContainer}>
                <Text style={styles.title}>{event.title}</Text>

                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="calendar-today"
                      size={20}
                      color={colors.accent}
                    />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(event.event_date)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol
                      ios_icon_name="location"
                      android_material_icon_name="location-on"
                      size={20}
                      color={colors.accent}
                    />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>{event.location}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionTitle}>About This Event</Text>
                  <Text style={styles.description}>{event.description}</Text>
                </View>

                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.calendarButton}
                    onPress={handleAddToCalendar}
                  >
                    <IconSymbol
                      ios_icon_name="calendar.badge.plus"
                      android_material_icon_name="event"
                      size={20}
                      color={colors.text}
                    />
                    <Text style={styles.calendarButtonText}>Add to Calendar</Text>
                  </TouchableOpacity>

                  {event.ticket_url && (
                    <TouchableOpacity
                      style={styles.ticketsButton}
                      onPress={handleGetTickets}
                    >
                      <Text style={styles.ticketsButtonText}>Get Tickets</Text>
                      <IconSymbol
                        ios_icon_name="ticket"
                        android_material_icon_name="confirmation-number"
                        size={20}
                        color={colors.background}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </LinearGradient>
    </>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 27, 78, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  flyerImage: {
    width: '100%',
    height: 350,
    backgroundColor: colors.card,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
    lineHeight: 36,
  },
  detailsCard: {
    backgroundColor: 'rgba(45, 27, 78, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  actionsContainer: {
    gap: 12,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 70, 193, 0.3)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  calendarButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  ticketsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    boxShadow: '0px 4px 12px rgba(251, 191, 36, 0.3)',
    elevation: 4,
  },
  ticketsButtonText: {
    fontSize: 16,
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
});
