
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
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

interface WordPressSong {
  id: number;
  title: { rendered: string };
  featured_media: number;
  acf: {
    artist: string;
    audio_url: string;
    release_date: string;
  };
}

interface Song {
  id: number;
  title: string;
  artist: string;
  coverImage: string | null;
  audioUrl: string;
  releaseDate: string;
}

const SONGS_API_URL = 'https://yohitradio.com/wp-json/wp/v2/song?per_page=20&orderby=date&order=desc';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  songCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  coverImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  songInfo: {
    flex: 1,
    marginLeft: 16,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: 8,
  },
  releaseDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#1A0B2E',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});

export default function NewReleasesScreen() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  async function fetchSongs() {
    try {
      setError(null);
      console.log('Fetching songs from:', SONGS_API_URL);
      const response = await fetch(SONGS_API_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch songs: ${response.status} ${response.statusText}`);
      }

      const data: WordPressSong[] = await response.json();
      console.log(`Fetched ${data.length} songs from WordPress API`);
      
      // Fetch cover images for each song
      const songsWithImages = await Promise.all(
        data.map(async (song) => {
          let coverImage: string | null = null;
          
          if (song.featured_media) {
            try {
              const mediaResponse = await fetch(
                `https://yohitradio.com/wp-json/wp/v2/media/${song.featured_media}`
              );
              if (mediaResponse.ok) {
                const mediaData = await mediaResponse.json();
                coverImage = mediaData.source_url || null;
                console.log(`Fetched cover image for song ${song.id}`);
              }
            } catch (err) {
              console.error(`Error fetching media for song ${song.id}:`, err);
            }
          }

          return {
            id: song.id,
            title: song.title.rendered,
            artist: song.acf?.artist || 'Unknown Artist',
            coverImage,
            audioUrl: song.acf?.audio_url || '',
            releaseDate: song.acf?.release_date || '',
          };
        })
      );

      setSongs(songsWithImages);
      console.log('Songs loaded successfully');
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError('Unable to load new releases. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    console.log('Refreshing songs...');
    setRefreshing(true);
    await fetchSongs();
  }

  function formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  function handleSongPress(song: Song) {
    console.log('Song pressed:', song.title);
    // TODO: Navigate to song details or play audio
    // router.push(`/song-details?id=${song.id}`);
  }

  if (loading) {
    return (
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer} edges={['top']}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading new releases...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
        <SafeAreaView style={styles.errorContainer} edges={['top']}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSongs}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>New Releases</Text>
            <Text style={styles.subtitle}>Latest songs from Yo Hit Radio</Text>
          </View>

          {songs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="music.note"
                android_material_icon_name="music-note"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No new releases yet</Text>
            </View>
          ) : (
            songs.map((song) => (
              <TouchableOpacity
                key={song.id}
                style={styles.songCard}
                onPress={() => handleSongPress(song)}
                activeOpacity={0.7}
              >
                <Image
                  source={
                    song.coverImage
                      ? { uri: song.coverImage }
                      : require('@/assets/images/natively-dark.png')
                  }
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={2}>
                    {song.title}
                  </Text>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {song.artist}
                  </Text>
                  {song.releaseDate && (
                    <Text style={styles.releaseDate}>
                      Released: {formatDate(song.releaseDate)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
