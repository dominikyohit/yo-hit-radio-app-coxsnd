import React, { useState, useEffect, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter, useLocalSearchParams } from 'expo-router'; // Added useLocalSearchParams
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  sortDate: Date;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    paddingBottom: 100, // Space for the floating tab bar
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gold,
    marginTop: 10,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  songCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginVertical: 8,
    marginHorizontal: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  songCardGradient: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  coverImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  songArtist: {
    color: colors.white,
    fontSize: 16,
    marginTop: 3,
  },
  releaseDate: {
    color: colors.lightGray,
    fontSize: 12,
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: colors.lightGray,
    fontSize: 16,
    textAlign: 'center',
  },
});

const NewReleasesScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams(); // Get local search params
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSongs = useCallback(async () => {
    try {
      const response = await fetch('https://yohitradio.com/wp-json/wp/v2/songs?_embed&per_page=100');
      const data: WordPressSong[] = await response.json();

      const formattedSongs: Song[] = data.map(song => ({
        id: song.id,
        title: decodeHtmlEntities(song.title.rendered),
        artist: song.acf.artist_name,
        coverImage: song._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
        audioUrl: song.acf.audio_url,
        releaseDate: song.acf.release_date,
        sortDate: new Date(song.acf.release_date),
      }));

      // Sort by release date, newest first
      formattedSongs.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

      setSongs(formattedSongs);
    } catch (error) {
      console.error('Failed to fetch new releases:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSongs();
  }, [fetchSongs]);

  const handleSongPress = (song: Song) => {
    // In this context, pressing a song in New Releases does not play it on the main radio stream.
    // If individual song playback is desired, it would require a separate audio player instance.
    // For now, this action could navigate to a song detail page or simply do nothing.
    console.log('Pressed song:', song.title);
    // Example: router.push({ pathname: '/song-details', params: { id: song.id.toString() } });
  };

  const renderSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity style={styles.songCard} onPress={() => handleSongPress(item)}>
      <LinearGradient
        colors={['rgba(100, 0, 150, 0.7)', 'rgba(50, 0, 100, 0.7)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.songCardGradient}
      >
        <Image
          source={item.coverImage ? { uri: item.coverImage } : require('@/assets/images/yohitradio-placeholder.png')}
          style={styles.coverImage}
        />
        <View style={styles.textContainer}>
          <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
          <Text style={styles.releaseDate}>Released: {item.releaseDate}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      );
    }
    return null;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>New Releases</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No new releases found.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[colors.darkPurple, colors.mediumPurple]}
        style={styles.gradientBackground}
      />
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSongItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading && renderEmpty()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            progressBackgroundColor={colors.darkPurple}
          />
        }
      />
    </SafeAreaView>
  );
};

export default NewReleasesScreen;
