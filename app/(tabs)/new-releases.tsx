
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import audioManager from '@/utils/audioManager';
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';

interface WordPressSong {
  id: number;
  title: { rendered: string };
  date: string;
  acf: {
    artist_name: string;
    audio_url: string;
    release_date: string;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
    }>;
  };
}

interface Song {
  id: number;
  title: string;
  artist: string;
  coverImage: string | null;
  audioUrl: string;
  releaseDate: string;
  sortDate: Date;
}

const SONGS_API_URL = 'https://yohitradio.com/wp-json/wp/v2/songs?_embed&per_page=20';

export default function NewReleasesScreen() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSongs();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await fetch(SONGS_API_URL);
      const data: WordPressSong[] = await response.json();

      const formattedSongs: Song[] = data
        .map((song) => ({
          id: song.id,
          title: song.title.rendered,
          artist: song.acf?.artist_name || 'Unknown Artist',
          coverImage: song._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          audioUrl: song.acf?.audio_url || '',
          releaseDate: song.acf?.release_date || song.date,
          sortDate: new Date(song.acf?.release_date || song.date),
        }))
        .filter((song) => song.audioUrl)
        .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

      setSongs(formattedSongs);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSongs();
  };

  const formatDate = (releaseDate: string | undefined, fallbackDate: string): string => {
    try {
      const date = new Date(releaseDate || fallbackDate);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Unknown Date';
    }
  };

  const handleSongPress = async (song: Song) => {
    try {
      if (playingSongId === song.id) {
        await audioManager.stopCurrentAudio();
        setSound(null);
        setPlayingSongId(null);
      } else {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: song.audioUrl },
          { shouldPlay: false }
        );

        setSound(newSound);
        await audioManager.playAudio(newSound, false);
        setPlayingSongId(song.id);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingSongId(null);
          }
        });
      }
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading new releases...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Releases</Text>
          <Text style={styles.headerSubtitle}>Fresh tracks from Yo Hit Radio</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        >
          {songs.map((song) => (
            <TouchableOpacity
              key={song.id}
              style={styles.songCard}
              onPress={() => handleSongPress(song)}
              activeOpacity={0.8}
            >
              <Image
                source={
                  song.coverImage
                    ? { uri: song.coverImage }
                    : require('@/assets/images/placeholder-cover.png')
                }
                style={styles.coverImage}
              />
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                  {song.artist}
                </Text>
                <Text style={styles.releaseDate}>{formatDate(song.releaseDate, song.releaseDate)}</Text>
              </View>
              <View style={styles.playIconContainer}>
                <IconSymbol
                  name={playingSongId === song.id ? 'pause.circle.fill' : 'play.circle.fill'}
                  size={40}
                  color={colors.accent}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, marginTop: 16 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', marginBottom: 4 },
  headerSubtitle: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 16 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  songCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  coverImage: { width: 70, height: 70, borderRadius: 12 },
  songInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  songTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  artistName: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginBottom: 4 },
  releaseDate: { color: colors.accent, fontSize: 12, fontWeight: '500' },
  playIconContainer: { marginLeft: 8 },
});
