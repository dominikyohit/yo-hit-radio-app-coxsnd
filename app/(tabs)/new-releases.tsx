
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
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
}

const SONGS_API_URL = 'https://yohitradio.com/wp-json/wp/v2/song?per_page=10&orderby=date&order=desc&_embed';

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
  playingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  playingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A0B2E',
  },
});

export default function NewReleasesScreen() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);

  useEffect(() => {
    fetchSongs();
    
    // Cleanup audio on unmount
    return () => {
      if (sound) {
        console.log('Unloading sound on unmount');
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

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
      
      // Map the WordPress data to our Song interface
      const mappedSongs: Song[] = data.map((song) => {
        // Extract cover image from _embedded
        const coverImage = song._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
        
        // Extract artist name from acf.artist_name
        const artist = song.acf?.artist_name || '';
        
        console.log(`Song: ${song.title.rendered}, Artist: ${artist}, Cover: ${coverImage ? 'Yes' : 'No'}`);
        
        return {
          id: song.id,
          title: song.title.rendered,
          artist: artist,
          coverImage: coverImage,
          audioUrl: song.acf?.audio_url || '',
          releaseDate: song.acf?.release_date || '',
        };
      });

      setSongs(mappedSongs);
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

  async function handleSongPress(song: Song) {
    console.log('Song pressed:', song.title);
    
    if (!song.audioUrl) {
      console.log('No audio URL available for this song');
      return;
    }

    try {
      // If the same song is playing, pause it
      if (playingSongId === song.id && sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          console.log('Pausing audio');
          await sound.pauseAsync();
          setPlayingSongId(null);
          return;
        } else if (status.isLoaded && !status.isPlaying) {
          console.log('Resuming audio');
          await sound.playAsync();
          setPlayingSongId(song.id);
          return;
        }
      }

      // Stop and unload previous sound
      if (sound) {
        console.log('Stopping previous audio');
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingSongId(null);
      }

      // Load and play new sound
      console.log('Loading audio from:', song.audioUrl);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log('Audio finished playing');
            setPlayingSongId(null);
          }
        }
      );

      setSound(newSound);
      setPlayingSongId(song.id);
      console.log('Playing audio for:', song.title);
    } catch (err) {
      console.error('Error playing audio:', err);
      setPlayingSongId(null);
    }
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
                {playingSongId === song.id && (
                  <View style={styles.playingIndicator}>
                    <Text style={styles.playingText}>PLAYING</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
