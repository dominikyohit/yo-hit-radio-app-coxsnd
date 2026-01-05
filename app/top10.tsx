
/**
 * Top 10 Voting Screen
 * Displays current week's top 10 songs with voting functionality
 * Integrates with backend API: GET /api/top10 and POST /api/top10/{id}/vote
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet, apiPost } from '@/utils/api';

interface Top10Song {
  id: string;
  rank: number;
  title: string;
  artist: string;
  cover_image_url: string | null;
  vote_count: number;
  week_start_date: string;
}

export default function Top10Screen() {
  const router = useRouter();
  const [songs, setSongs] = useState<Top10Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const fetchTop10 = useCallback(async () => {
    try {
      setError(null);
      console.log('[Top10] Fetching top 10 songs from API...');
      const data = await apiGet<Top10Song[]>('/api/top10');
      console.log('[Top10] Fetched songs:', data);
      setSongs(data);
    } catch (err) {
      console.error('[Top10] Error fetching songs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load top 10');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTop10();
  }, [fetchTop10]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTop10();
  }, [fetchTop10]);

  const handleVote = async (song: Top10Song) => {
    try {
      setVotingId(song.id);
      console.log('[Top10] Voting for song:', song.id);
      
      const updatedSong = await apiPost<Top10Song>(`/api/top10/${song.id}/vote`, {});
      console.log('[Top10] Vote successful:', updatedSong);
      
      // Update the song in the list with new vote count
      setSongs(prevSongs =>
        prevSongs.map(s => s.id === song.id ? updatedSong : s)
      );
      
      Alert.alert(
        'Vote Recorded!',
        `You voted for "${song.title}" by ${song.artist}`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('[Top10] Error voting:', err);
      Alert.alert(
        'Vote Failed',
        'Unable to record your vote. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setVotingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const renderSongItem = ({ item }: { item: Top10Song }) => {
    const isVoting = votingId === item.id;

    return (
      <View style={styles.songItem}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{item.rank}</Text>
        </View>
        
        {item.cover_image_url ? (
          <Image
            source={{ uri: item.cover_image_url }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.placeholderCover]}>
            <IconSymbol 
              ios_icon_name="music.note" 
              android_material_icon_name="music-note" 
              size={32} 
              color="#FFD700" 
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
          <View style={styles.voteCountContainer}>
            <IconSymbol 
              ios_icon_name="heart.fill" 
              android_material_icon_name="favorite" 
              size={14} 
              color="#FF6B9D" 
            />
            <Text style={styles.voteCount}>{item.vote_count} votes</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.voteButton, isVoting && styles.voteButtonDisabled]}
          onPress={() => handleVote(item)}
          disabled={isVoting}
          activeOpacity={0.7}
        >
          {isVoting ? (
            <ActivityIndicator size="small" color="#1a0033" />
          ) : (
            <>
              <IconSymbol 
                ios_icon_name="heart.fill" 
                android_material_icon_name="favorite" 
                size={20} 
                color="#1a0033" 
              />
              <Text style={styles.voteButtonText}>Vote</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <IconSymbol 
                  ios_icon_name="chevron.left" 
                  android_material_icon_name="arrow-back" 
                  size={24} 
                  color="#FFD700" 
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Top 10 This Week</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading top 10…</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  if (error && songs.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <IconSymbol 
                  ios_icon_name="chevron.left" 
                  android_material_icon_name="arrow-back" 
                  size={24} 
                  color="#FFD700" 
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Top 10 This Week</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={styles.errorContainer}>
              <IconSymbol 
                ios_icon_name="exclamationmark.triangle" 
                android_material_icon_name="warning" 
                size={48} 
                color="#FFD700" 
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchTop10}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  const weekStartDate = songs.length > 0 ? formatDate(songs[0].week_start_date) : '';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol 
                ios_icon_name="chevron.left" 
                android_material_icon_name="arrow-back" 
                size={24} 
                color="#FFD700" 
              />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Top 10 This Week</Text>
              {weekStartDate && (
                <Text style={styles.weekDate}>Week of {weekStartDate}</Text>
              )}
            </View>
            <View style={styles.placeholder} />
          </View>

          {songs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol 
                ios_icon_name="music.note.list" 
                android_material_icon_name="music-note" 
                size={64} 
                color="rgba(255, 215, 0, 0.3)" 
              />
              <Text style={styles.emptyText}>No songs in the top 10 yet</Text>
              <Text style={styles.emptySubtext}>Check back soon!</Text>
            </View>
          ) : (
            <FlatList
              data={songs}
              renderItem={renderSongItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#FFD700"
                  colors={['#FFD700']}
                />
              }
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  weekDate: {
    fontSize: 12,
    color: 'rgba(255, 215, 0, 0.7)',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a0033',
  },
  coverImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderCover: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
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
    color: 'rgba(227, 227, 227, 0.7)',
    marginBottom: 4,
  },
  voteCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteCount: {
    fontSize: 12,
    color: 'rgba(227, 227, 227, 0.6)',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  voteButtonDisabled: {
    opacity: 0.6,
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a0033',
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#1a0033',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(227, 227, 227, 0.6)',
    marginTop: 8,
    textAlign: 'center',
  },
});
