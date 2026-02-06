
import React, { useState } from 'react';
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

export default function EventDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const titleRaw = String(params.title || '');
  const title = decodeHtmlEntities(titleRaw);
  const eventDateRaw = String(params.event_date_raw || '');
  const eventLocation = String(params.event_location || '');
  const eventPrice = String(params.event_price || '');
  const eventArtists = String(params.event_artists || '');
  const ticketLink = String(params.ticket_link || '');
  const flyerImage = String(params.flyer_image || '');
  
  const [loading] = useState(false);
  
  const eventDate = parseEventDate(eventDateRaw);
  const formattedDate = formatDateFull(eventDate);

  const handleBuyTicket = async () => {
    if (!ticketLink) {
      console.log('[EventDetails] No ticket link available');
      return;
    }
    
    try {
      console.log('[EventDetails] Opening ticket link:', ticketLink);
      const canOpen = await Linking.canOpenURL(ticketLink);
      if (canOpen) {
        await Linking.openURL(ticketLink);
      } else {
        console.error('[EventDetails] Cannot open URL:', ticketLink);
      }
    } catch (error) {
      console.error('[EventDetails] Error opening ticket link:', error);
    }
  };

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

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Loading event...</Text>
            </View>
          ) : (
            <React.Fragment>
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
            </React.Fragment>
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
});
