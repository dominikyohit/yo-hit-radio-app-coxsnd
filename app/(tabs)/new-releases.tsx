
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import React, { useState, useEffect, useRef } from 'react';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { stopGlobalAudio } from './index';
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

const SONGS_API_URL = 'https://yohitradio.com/wp-json/wp/v2/song?per_page=10&orderby=date&order=desc&_embed';

export default function NewReleasesScreen() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);
  const sound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await fetch(SONGS_API_URL);
      const data: WordPressSong[] = await response.json();

      const transformedSongs: Song[] = data
        .map((song) => {
          const releaseDate = song.acf?.release_date || song.date;
          let sortDate: Date;

          if (song.acf?.release_date && /^\d{8}$/.test(song.acf.release_date)) {
            const year = parseInt(song.acf.release_date.substring(0, 4));
            const month = parseInt(song.acf.release_date.substring(4, 6)) - 1;
            const day = parseInt(song.acf.release_date.substring(6, 8));
            sortDate = new Date(year, month, day);
          } else {
            sortDate = new Date(song.date);
          }

          return {
            id: song.id,
            title: song.title.rendered,
            artist: song.acf?.artist_name || 'Unknown Artist',
            coverImage: song._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
            audioUrl: song.acf?.audio_url || '',
            releaseDate,
            sortDate,
          };
        })
        .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

      setSongs(transformedSongs);
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
    if (releaseDate && /^\d{8}$/.test(releaseDate)) {
      const year = releaseDate.substring(0, 4);
      const month = releaseDate.substring(4, 6);
      const day = releaseDate.substring(6, 8);
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const date = new Date(fallbackDate);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleSongPress = async (song: Song) => {
    try {
      // Stop any other audio source first
      await stopGlobalAudio();

      if (playingSongId === song.id) {
        if (sound.current) {
          const status = await sound.current.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.current.pauseAsync();
            setPlayingSongId(null);
          } else if (status.isLoaded) {
            await sound.current.playAsync();
            setPlayingSongId(song.id);
          }
        }
      } else {
        if (sound.current) {
          await sound.current.unloadAsync();
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: song.audioUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setPlayingSongId(null);
            }
          }
        );

        sound.current = newSound;
        setPlayingSongId(song.id);
      }
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Releases</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Releases</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        >
          {songs.map((song) => (
            <TouchableOpacity key={song.id} style={styles.songCard} onPress={() => handleSongPress(song)}>
              <Image
                source={song.coverImage ? { uri: song.coverImage } : require('@/assets/images/cb5c7722-e8b4-4739-ac47-c7375d4682f9.png')}
                style={styles.coverImage}
              />
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                  {song.artist}
                </Text>
                <Text style={styles.releaseDate}>{formatDate(song.releaseDate, song.sortDate.toISOString())}</Text>
              </View>
              <IconSymbol
                name={playingSongId === song.id ? 'pause.circle.fill' : 'play.circle.fill'}
                size={40}
                color={colors.accent}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  coverImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  releaseDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
