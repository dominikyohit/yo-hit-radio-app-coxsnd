
import { IconSymbol } from '@/components/IconSymbol';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { colors } from '@/styles/commonStyles';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';

// WordPress REST API response format
interface WordPressPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  link: string;
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url?: string;
    }[];
  };
}

// Mapped Article object for UI
interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image_url: string | null;
  published_date: string;
  author: string;
  created_at: string;
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
    .replace(/&apos;/g, "'") // Replace &apos; with '
    .trim();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0015',
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
});

export default function NewsScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const fetchArticles = useCallback(async (pageNumber: number) => {
    console.log('[News] Fetching articles for page:', pageNumber);
    
    // Prevent multiple simultaneous requests
    if (pageNumber > 1 && loadingMore) {
      console.log('[News] Already loading more, skipping request');
      return;
    }

    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      // Fetch 20 articles per page
      const response = await fetch(
        `https://yohitradio.com/wp-json/wp/v2/posts?_embed&per_page=20&page=${pageNumber}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const wpPosts: WordPressPost[] = await response.json();
      console.log('[News] Fetched WordPress posts:', wpPosts.length, 'articles');
      
      // Map WordPress posts to Article format for UI
      const mappedArticles: Article[] = wpPosts.map((post) => {
        const decodedTitle = decodeHtmlEntities(post.title?.rendered ?? '');
        
        return {
          id: String(post.id),
          title: decodedTitle,
          excerpt: stripHtml(post.excerpt?.rendered ?? ''),
          content: post.content?.rendered ?? '',
          featured_image_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null,
          published_date: post.date ?? '',
          author: 'Yo Hit Radio',
          created_at: post.date ?? '',
        };
      });
      
      // If we got fewer than 20 articles, we've reached the end
      if (mappedArticles.length < 20) {
        setHasMore(false);
        console.log('[News] Reached end of articles');
      }
      
      if (pageNumber === 1) {
        setArticles(mappedArticles);
      } else {
        // Append new articles to existing ones
        setArticles((prev) => [...prev, ...mappedArticles]);
      }
      
      setPage(pageNumber);
    } catch (err) {
      console.error('[News] Error fetching articles:', err);
      if (pageNumber === 1) {
        setError('Failed to load articles. Please try again.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loadingMore]);

  useEffect(() => {
    fetchArticles(1);
  }, [fetchArticles]);

  const loadMoreArticles = useCallback(() => {
    if (!loadingMore && hasMore) {
      console.log('[News] Loading more articles, next page:', page + 1);
      fetchArticles(page + 1);
    }
  }, [loadingMore, hasMore, page, fetchArticles]);

  const formatDate = useCallback((dateString: string): string => {
    // Handle empty or invalid dates
    if (!dateString) {
      return '';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  }, []);

  const handleArticlePress = useCallback((article: Article) => {
    console.log('[News] User tapped article:', article.title);
    router.push({
      pathname: '/article-details',
      params: { id: article.id },
    });
  }, [router]);

  const renderArticleItem = ({ item }: { item: Article }) => {
    const formattedDate = formatDate(item.published_date);
    
    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() => handleArticlePress(item)}
        activeOpacity={0.8}
      >
        {item.featured_image_url && (
          <Image
            source={{ uri: item.featured_image_url }}
            style={styles.articleImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.articleContent}>
          <Text style={styles.articleTitle} numberOfLines={2}>
            {item.title || 'Untitled'}
          </Text>
          <Text style={styles.articleExcerpt} numberOfLines={2}>
            {item.excerpt}
          </Text>
          {formattedDate && (
            <Text style={styles.articleDate}>{formattedDate}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>News</Text>
      <Text style={styles.subtitle}>Latest updates from Yo Hit Radio</Text>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No articles available</Text>
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error && page === 1) {
    return (
      <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchArticles(1)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={articles}
          renderItem={renderArticleItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMoreArticles}
          onEndReachedThreshold={0.5}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
