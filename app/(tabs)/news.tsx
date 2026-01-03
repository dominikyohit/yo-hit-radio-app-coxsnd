
import { apiGet } from '@/utils/api';
import { IconSymbol } from '@/components/IconSymbol';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { colors } from '@/styles/commonStyles';

// WordPress REST API format
interface Article {
  id: number; // WordPress uses numeric IDs
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  link: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
    }>;
  };
}

// Helper function to strip HTML tags
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#039;/g, "'") // Replace &#039; with '
    .trim();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0015',
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
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#b8a0ff',
  },
  articleCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  articleImage: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  articleContent: {
    padding: 16,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  articleExcerpt: {
    fontSize: 14,
    color: '#b8a0ff',
    lineHeight: 20,
    marginBottom: 8,
  },
  articleDate: {
    fontSize: 12,
    color: '#8b7ab8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#b8a0ff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default function NewsScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch articles from backend API
      // Backend fetches from WordPress REST API and returns the data
      const data = await apiGet<Article[]>('/api/articles');
      console.log('Fetched articles:', data);
      setArticles(data);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleArticlePress = (article: Article) => {
    router.push({
      pathname: '/article-details',
      params: { id: article.id.toString() },
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchArticles}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>News</Text>
            <Text style={styles.subtitle}>Latest updates from Yo Hit Radio</Text>
          </View>

          {articles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No articles available</Text>
            </View>
          ) : (
            articles.map((article) => {
              // Extract featured image from _embedded
              const featuredUrl = article._embedded?.['wp:featuredmedia']?.[0]?.source_url;

              return (
                <TouchableOpacity
                  key={article.id}
                  style={styles.articleCard}
                  onPress={() => handleArticlePress(article)}
                  activeOpacity={0.8}
                >
                  {featuredUrl && (
                    <Image
                      source={{ uri: featuredUrl }}
                      style={styles.articleImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.articleContent}>
                    <Text style={styles.articleTitle} numberOfLines={2}>
                      {article.title?.rendered || 'Untitled'}
                    </Text>
                    <Text style={styles.articleExcerpt} numberOfLines={2}>
                      {stripHtml(article.excerpt?.rendered || '')}
                    </Text>
                    <Text style={styles.articleDate}>{formatDate(article.date)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
