
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
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

interface WordPressRelease {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url?: string;
    }[];
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  releaseCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
  },
  releaseImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.cardBackground,
  },
  releaseContent: {
    padding: 16,
  },
  releaseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  releaseExcerpt: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  releaseDate: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

export default function NewReleasesScreen() {
  const router = useRouter();
  const [releases, setReleases] = useState<WordPressRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      // Fetch latest posts from WordPress - ordered by date (most recent first)
      // You can adjust the categories parameter to filter by a specific category ID
      const response = await fetch(
        'https://yohitradio.com/wp-json/wp/v2/posts?per_page=20&order=desc&orderby=date&_embed=1'
      );
      const data: WordPressRelease[] = await response.json();
      setReleases(data);
    } catch (error) {
      console.error('Error fetching releases:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReleases();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleReleasePress = (release: WordPressRelease) => {
    router.push({
      pathname: '/article-details',
      params: { id: release.id.toString() },
    });
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading New Releases...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>New Releases</Text>
          <Text style={styles.subtitle}>Latest songs and tracks</Text>
        </View>

        <ScrollView
          style={styles.container}
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
          {releases.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                ios_icon_name="music.note"
                android_material_icon_name="music-note"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No new releases available at the moment</Text>
            </View>
          ) : (
            releases.map((release) => (
              <TouchableOpacity
                key={release.id}
                style={styles.releaseCard}
                onPress={() => handleReleasePress(release)}
                activeOpacity={0.8}
              >
                {release._embedded?.['wp:featuredmedia']?.[0]?.source_url && (
                  <Image
                    source={{ uri: release._embedded['wp:featuredmedia'][0].source_url }}
                    style={styles.releaseImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.releaseContent}>
                  <Text style={styles.releaseTitle} numberOfLines={2}>
                    {stripHtml(release.title.rendered)}
                  </Text>
                  <Text style={styles.releaseExcerpt} numberOfLines={3}>
                    {stripHtml(release.excerpt.rendered)}
                  </Text>
                  <Text style={styles.releaseDate}>{formatDate(release.date)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
