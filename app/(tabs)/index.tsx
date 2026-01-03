
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BACKEND_URL } from '@/utils/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const rotation = useSharedValue(0);

  // Log backend URL on mount for debugging
  useEffect(() => {
    console.log('[App] Backend URL configured:', BACKEND_URL);
  }, []);

  // Animated rotation for the play button
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  useEffect(() => {
    // Configure audio mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying]);

  const togglePlayback = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        setIsLoading(true);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: 'https://stream.zeno.fm/hmc38shnrwzuv' },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
    }
  };

  const shortcuts = [
    { title: 'News', icon: 'article', route: '/(tabs)/news' },
    { title: 'Top 10', icon: 'music-note', route: '/(tabs)/top10' },
    { title: 'Events', icon: 'event', route: '/(tabs)/events' },
  ];

  return (
    <LinearGradient
      colors={[colors.background, colors.card, colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={{ uri: 'https://prod-finalquest-user-projects-storage-bucket-aws.s3.amazonaws.com/user-projects/ee56f6a2-c621-44e1-862b-ddbf7d8dce99/assets/images/14c4a560-f518-4dca-a82d-8b2977bf3151.jpeg?AWSAccessKeyId=AKIAVRUVRKQJC5DISQ4Q&Signature=H%2FNEhs3zjnqZmCe9uI37GWADHBc%3D&Expires=1767494669' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          {/* Now Playing Card */}
          <View style={styles.nowPlayingCard}>
            <View style={styles.cardHeader}>
              <IconSymbol
                ios_icon_name="radio"
                android_material_icon_name="radio"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.cardTitle}>Now Playing</Text>
            </View>
            
            <View style={styles.nowPlayingContent}>
              <View style={styles.coverPlaceholder}>
                <IconSymbol
                  ios_icon_name="music.note"
                  android_material_icon_name="music-note"
                  size={48}
                  color={colors.accent}
                />
              </View>
              
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>Yo Hit Radio</Text>
                <Text style={styles.trackArtist}>Live Stream</Text>
                <View style={styles.liveStatusBadge}>
                  <View style={styles.liveStatusDot} />
                  <Text style={styles.liveStatusText}>ON AIR</Text>
                </View>
              </View>
            </View>

            {/* Large Circular Play/Pause Button */}
            <View style={styles.playButtonContainer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayback}
                disabled={isLoading}
              >
                <Animated.View style={[styles.playButtonInner, animatedStyle]}>
                  <LinearGradient
                    colors={[colors.accent, colors.highlight]}
                    style={styles.playButtonGradient}
                  >
                    {isLoading ? (
                      <IconSymbol
                        ios_icon_name="hourglass"
                        android_material_icon_name="hourglass-empty"
                        size={48}
                        color={colors.background}
                      />
                    ) : (
                      <IconSymbol
                        ios_icon_name={isPlaying ? 'pause.fill' : 'play.fill'}
                        android_material_icon_name={isPlaying ? 'pause' : 'play-arrow'}
                        size={48}
                        color={colors.background}
                      />
                    )}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Listen Live Button */}
            <TouchableOpacity
              style={styles.listenLiveButton}
              onPress={togglePlayback}
              disabled={isLoading}
            >
              <Text style={styles.listenLiveText}>
                {isPlaying ? 'Listening Live' : 'Listen Live'}
              </Text>
              <IconSymbol
                ios_icon_name="antenna.radiowaves.left.and.right"
                android_material_icon_name="radio"
                size={20}
                color={colors.background}
              />
            </TouchableOpacity>
          </View>

          {/* Shortcut Cards */}
          <View style={styles.shortcutsSection}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.shortcutsGrid}>
              {shortcuts.map((shortcut, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.shortcutCard}
                  onPress={() => router.push(shortcut.route as any)}
                >
                  <View style={styles.shortcutIconContainer}>
                    <IconSymbol
                      ios_icon_name={shortcut.icon}
                      android_material_icon_name={shortcut.icon}
                      size={32}
                      color={colors.accent}
                    />
                  </View>
                  <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 20,
    marginBottom: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  liveText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nowPlayingCard: {
    backgroundColor: 'rgba(45, 27, 78, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.4)',
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  nowPlayingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  coverPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 70, 193, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  trackArtist: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 6,
  },
  liveStatusText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  playButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    boxShadow: '0px 8px 24px rgba(251, 191, 36, 0.4)',
    elevation: 8,
  },
  playButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  playButtonGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenLiveButton: {
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
  listenLiveText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
    marginRight: 8,
  },
  shortcutsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: 'rgba(45, 27, 78, 0.6)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  shortcutIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(107, 70, 193, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
