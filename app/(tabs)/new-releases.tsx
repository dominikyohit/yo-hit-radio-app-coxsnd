
import React, { useState, useEffect, useCallback } from 'react';
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
import AudioManager from '@/utils/audioManager';

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
    'wp:featuredmedia'?: {
      source_url?: string;
    }[];
  };
}

interface Song {
  id: number;
  title: string;
  artist: string;
  coverImage: string | null;
  audioUrl: string;
  releaseDate: string;
  sortDate: Date; // Used for sorting
}

const SONGS_API_URL = 'https://yohitradio.com/wp-json/wp/v2/song?per_page=10&orderby=date&order=desc&_embed';

export default function NewReleasesScreen() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioManager = AudioManager.getInstance();

  const fetchSongs = useCallback(async () => {
    try {
      const response = await fetch(SONGS_API_URL);
      const data: WordPressSong[] = await response.json();

      const formattedSongs: Song[] = data.map((song) => {
        // Determine which date to use for sorting
        let sortDate: Date;
        
        // Try to use release_date first
        if (song.acf?.release_date && /^\d{8}$/.test(song.acf.release_date)) {
          const year = song.acf.release_date.substring(0, 4);
          const month = song.acf.release_date.substring(4, 6);
          const day = song.acf.release_date.substring(6, 8);
          sortDate = new Date(`${year}-${month}-${day}`);
        } else {
          // Fallback to post publish date
          sortDate = new Date(song.date);
        }

        return {
          id: song.id,
          title: song.title.rendered,
          artist: song.acf?.artist_name || 'Unknown Artist',
          coverImage: song._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          audioUrl: song.acf?.audio_url || '',
          releaseDate: formatDate(song.acf?.release_date, song.date),
          sortDate: sortDate,
        };
      });

      // Sort by release date from newest to oldest
      const sortedSongs = formattedSongs.sort((a, b) => {
        return b.sortDate.getTime() - a.sortDate.getTime();
      });

      setSongs(sortedSongs);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSongs();
  };

  const formatDate = (releaseDate: string | undefined, fallbackDate: string): string => {
    let dateToFormat = releaseDate;
    
    // If release_date exists and is in YYYYMMDD format
    if (releaseDate && /^\d{8}$/.test(releaseDate)) {
      const year = releaseDate.substring(0, 4);
      const month = releaseDate.substring(4, 6);
      const day = releaseDate.substring(6, 8);
      const date = new Date(`${year}-${month}-${day}`);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${day}, ${year}`;
    }
    
    // Fallback to post.date if release_date is empty or invalid
    if (!releaseDate || releaseDate.trim() === '') {
      dateToFormat = fallbackDate;
    }
    
    // Format ISO date string
    if (dateToFormat) {
      try {
        const date = new Date(dateToFormat);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    }
    
    return '';
  };

  const handleSongPress = async (song: Song) => {
    if (!song.audioUrl) {
      console.log('No audio URL available for this song');
      return;
    }

    try {
      // Check if this song is currently playing
      const currentUri = audioManager.getCurrentUri();
      const isCurrentlyPlaying = await audioManager.isPlaying();
      
      if (currentUri === song.audioUrl && isCurrentlyPlaying) {
        // Stop currently playing song
        await audioManager.stopCurrentAudio();
        setPlayingId(null);
      } else {
        // Play new song (will automatically stop live stream or other songs)
        await audioManager.playAudio(song.audioUrl, false);
        setPlayingId(song.id);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingId(null);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.background, colors.card, colors.background]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
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
    <LinearGradient
      colors={[colors.background, colors.card, colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Releases</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        >
          {songs.map((song, index) => (
            <TouchableOpacity
              key={index}
              style={styles.songCard}
              onPress={() => handleSongPress(song)}
              activeOpacity={0.7}
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
                    size={30}
                    color="rgba(255, 255, 255, 0.3)"
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
                {song.releaseDate && (
                  <Text style={styles.releaseDate}>{song.releaseDate}</Text>
                )}
              </View>
              <View style={styles.playButton}>
                <IconSymbol
                  ios_icon_name={playingId === song.id ? 'pause.circle.fill' : 'play.circle.fill'}
                  android_material_icon_name={playingId === song.id ? 'pause-circle-filled' : 'play-circle-filled'}
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
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  coverImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  placeholderCover: {
    width: 60,
    height: 60,
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
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  releaseDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  playButton: {
    padding: 4,
  },
});
