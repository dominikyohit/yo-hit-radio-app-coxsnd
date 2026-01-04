
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
import React, { useState, useEffect } from 'react';
import audioManager from '@/utils/audioManager';
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

const SONGS_API_URL = 'https://yohitradio.com/wp-json/wp/v2/song?per_page=10&orderby=date&order=desc&_embed';

export default function NewReleasesScreen() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await fetch(SONGS_API_URL);
      const data: WordPressSong[] = await response.json();

      const formattedSongs: Song[] = data.map((song) => {
        const releaseDate = song.acf?.release_date || song.date;
        const sortDate = song.acf?.release_date
          ? new Date(
              parseInt(song.acf.release_date.substring(0, 4)),
              parseInt(song.acf.release_date.substring(4, 6)) - 1,
              parseInt(song.acf.release_date.substring(6, 8))
            )
          : new Date(song.date);

        return {
          id: song.id,
          title: song.title.rendered,
          artist: song.acf?.artist_name || 'Unknown Artist',
          coverImage: song._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          audioUrl: song.acf?.audio_url || '',
          releaseDate: releaseDate,
          sortDate: sortDate,
        };
      });

      formattedSongs.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

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
    if (releaseDate && releaseDate.length === 8) {
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
    if (!song.audioUrl) {
      console.warn('No audio URL available for this song');
      return;
    }

    if (playingSongId === song.id) {
      await audioManager.stop();
      setPlayingSongId(null);
    } else {
      await audioManager.playTrack(song.audioUrl);
      setPlayingSongId(song.id);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          <Text style={styles.header}>New Releases</Text>

          {songs.map((song) => (
            <TouchableOpacity
              key={song.id}
              style={styles.songCard}
              onPress={() => handleSongPress(song)}
              activeOpacity={0.8}
            >
              {song.coverImage ? (
                <Image
                  source={{ uri: song.coverImage }}
                  style={styles.coverImage}
                />
              ) : (
                <View style={styles.placeholderCover}>
                  <IconSymbol 
                    ios_icon_name="music.note" 
                    android_material_icon_name="music-note" 
                    size={40} 
                    color={colors.accent} 
                  />
                </View>
              )}

              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                  {song.artist}
                </Text>
                <Text style={styles.releaseDate}>
                  {formatDate(song.acf?.release_date, song.releaseDate)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.playButton}
                onPress={() => handleSongPress(song)}
              >
                <IconSymbol
                  ios_icon_name={playingSongId === song.id ? 'pause.circle.fill' : 'play.circle.fill'}
                  android_material_icon_name={playingSongId === song.id ? 'pause-circle' : 'play-circle'}
                  size={40}
                  color={colors.accent}
                />
              </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  songCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  coverImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  placeholderCover: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
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
    marginBottom: 4,
  },
  releaseDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  playButton: {
    padding: 4,
  },
});
