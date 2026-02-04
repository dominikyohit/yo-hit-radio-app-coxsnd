
import React, { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import AudioManager from '@/utils/audioManager';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';

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

export default function NewReleasesScreen() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const audioManager = AudioManager.getInstance();

  useEffect(() => {
    fetchSongs(1);
  }, []);

  const fetchSongs = useCallback(async (pageNumber: number) => {
    console.log('[Releases] Fetching songs for page:', pageNumber);
    
    // Prevent multiple simultaneous requests
    if (pageNumber > 1 && loadingMore) {
      console.log('[Releases] Already loading more, skipping request');
      return;
    }

    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Fetch 20 songs per page
      const response = await fetch(
        `https://yohitradio.com/wp-json/wp/v2/song?per_page=20&page=${pageNumber}&orderby=date&order=desc&_embed`
      );
      const data: WordPressSong[] = await response.json();
      console.log('[Releases] Fetched songs:', data.length, 'songs');

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

        const decodedTitle = decodeHtmlEntities(song.title.rendered);

        return {
          id: song.id,
          title: decodedTitle,
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

      // If we got fewer than 20 songs, we've reached the end
      if (sortedSongs.length < 20) {
        setHasMore(false);
        console.log('[Releases] Reached end of songs');
      }

      if (pageNumber === 1) {
        setSongs(sortedSongs);
      } else {
        // Append new songs to existing ones
        setSongs((prev) => [...prev, ...sortedSongs]);
      }
      
      setPage(pageNumber);
    } catch (error) {
      console.error('[Releases] Error fetching songs:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [loadingMore]);

  const loadMoreSongs = useCallback(() => {
    if (!loadingMore && hasMore) {
      console.log('[Releases] Loading more songs, next page:', page + 1);
      fetchSongs(page + 1);
    }
  }, [loadingMore, hasMore, page, fetchSongs]);

  const handleRefresh = () => {
    console.log('[Releases] User refreshing releases');
    setRefreshing(true);
    setHasMore(true);
    fetchSongs(1);
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
    console.log('[Releases] User tapped song:', song.title);
    
    if (!song.audioUrl) {
      console.log('[Releases] No audio URL available for this song');
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
      console.error('[Releases] Error playing audio:', error);
      setPlayingId(null);
    }
  };

  const renderSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={styles.songCard}
      onPress={() => handleSongPress(item)}
      activeOpacity={0.7}
    >
      {item.coverImage ? (
        <Image
          source={{ uri: item.coverImage }}
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
          {item.title}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.artist}
        </Text>
        {item.releaseDate && (
          <Text style={styles.releaseDate}>{item.releaseDate}</Text>
        )}
      </View>
      <View style={styles.playButton}>
        <IconSymbol
          ios_icon_name={playingId === item.id ? 'pause.circle.fill' : 'play.circle.fill'}
          android_material_icon_name={playingId === item.id ? 'pause-circle-filled' : 'play-circle-filled'}
          size={40}
          color={colors.accent}
        />
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>New Releases</Text>
    </View>
  );

  if (loading && page === 1) {
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
        <FlatList
          data={songs}
          renderItem={renderSongItem}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              tintColor={colors.accent} 
            />
          }
          onEndReached={loadMoreSongs}
          onEndReachedThreshold={0.5}
        />
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
  listContent: {
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
