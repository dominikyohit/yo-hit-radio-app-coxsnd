
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet, apiPost } from '@/utils/api';

interface Song {
  id: string;
  rank: number;
  title: string;
  artist: string;
  cover_image_url: string | null;
  vote_count: number;
  week_start_date: string;
}

export default function Top10Screen() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votedSongs, setVotedSongs] = useState<Set<string>>(new Set());
  const [votingInProgress, setVotingInProgress] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[Top10] Fetching songs from API...');
      const data = await apiGet<Song[]>('/api/top10');
      console.log('[Top10] Fetched songs:', data);
      setSongs(data);
    } catch (err) {
      console.error('[Top10] Error fetching songs:', err);
      setError('Failed to load top 10 songs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (songId: string) => {
    if (votedSongs.has(songId) || votingInProgress.has(songId)) {
      return; // Already voted or voting in progress
    }

    try {
      setVotingInProgress((prev) => new Set(prev).add(songId));
      console.log('[Top10] Voting for song:', songId);
      
      const updatedSong = await apiPost<Song>(`/api/top10/${songId}/vote`, {});
      console.log('[Top10] Vote successful:', updatedSong);
      
      // Update the song in the list with the new vote count
      setSongs((prevSongs) =>
        prevSongs.map((song) =>
          song.id === songId ? updatedSong : song
        )
      );
      
      // Mark as voted
      setVotedSongs((prev) => new Set(prev).add(songId));
      
      Alert.alert('Success', 'Your vote has been counted!');
    } catch (err) {
      console.error('[Top10] Error voting:', err);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    } finally {
      setVotingInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(songId);
        return newSet;
      });
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return colors.accent;
    if (rank === 2) return colors.textSecondary;
    if (rank === 3) return '#cd7f32';
    return colors.text;
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.card, colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Top 10</Text>
          <View style={styles.weekBadge}>
            <Text style={styles.weekText}>This Week</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading top 10...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle"
              android_material_icon_name="error"
              size={48}
              color={colors.highlight}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchSongs}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : songs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="music.note"
              android_material_icon_name="music-note"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No songs available this week</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {songs.map((song) => (
              <View key={song.id} style={styles.songCard}>
                <View style={styles.rankContainer}>
                  <Text style={[styles.rankNumber, { color: getRankColor(song.rank) }]}>
                    {song.rank}
                  </Text>
                </View>

                {song.cover_image_url && (
                  <Image
                    source={{ uri: song.cover_image_url }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {song.title}
                  </Text>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {song.artist}
                  </Text>
                  <View style={styles.votesContainer}>
                    <IconSymbol
                      ios_icon_name="flame"
                      android_material_icon_name="local-fire-department"
                      size={16}
                      color={colors.highlight}
                    />
                    <Text style={styles.votesText}>{song.vote_count}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    (votedSongs.has(song.id) || votingInProgress.has(song.id)) && 
                      styles.voteButtonDisabled,
                  ]}
                  onPress={() => handleVote(song.id)}
                  disabled={votedSongs.has(song.id) || votingInProgress.has(song.id)}
                >
                  {votingInProgress.has(song.id) ? (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  ) : (
                    <Text
                      style={[
                        styles.voteButtonText,
                        votedSongs.has(song.id) && styles.voteButtonTextDisabled,
                      ]}
                    >
                      {votedSongs.has(song.id) ? 'Voted' : 'Vote'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  weekBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  weekText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 27, 78, 0.8)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  coverImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.card,
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  votesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  votesText: {
    fontSize: 12,
    color: colors.highlight,
    fontWeight: '600',
    marginLeft: 4,
  },
  voteButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    boxShadow: '0px 2px 8px rgba(251, 191, 36, 0.3)',
    elevation: 2,
  },
  voteButtonDisabled: {
    backgroundColor: 'rgba(107, 70, 193, 0.3)',
  },
  voteButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  voteButtonTextDisabled: {
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});
