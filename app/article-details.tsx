
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';

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
  link: string;
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
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  shareButton: {
    padding: 8,
  },
  featuredImage: {
    width: '100%',
    height: 250,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 36,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateText: {
    fontSize: 14,
    color: '#8b7ab8',
  },
  authorText: {
    fontSize: 14,
    color: '#8b7ab8',
    marginLeft: 16,
  },
  content: {
    fontSize: 16,
    color: '#e0d0ff',
    lineHeight: 26,
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
});

export default function ArticleDetailsScreen() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id, fetchArticle]);

  const fetchArticle = useCallback(async () => {
    if (!id) {
      setError('No article ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch from WordPress REST API
      const response = await fetch(`https://yohitradio.com/wp-json/wp/v2/posts/${id}?_embed`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const wpPost: WordPressPost = await response.json();
      console.log('[ArticleDetails] Fetched WordPress post:', wpPost);
      
      // Map WordPress post to Article format for UI
      const mappedArticle: Article = {
        id: String(wpPost.id),
        title: wpPost.title?.rendered ?? '',
        excerpt: stripHtml(wpPost.excerpt?.rendered ?? ''),
        content: stripHtml(wpPost.content?.rendered ?? ''),
        featured_image_url: wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null,
        published_date: wpPost.date ?? '',
        author: 'Yo Hit Radio',
        created_at: wpPost.date ?? '',
        link: wpPost.link ?? '',
      };
      
      console.log('[ArticleDetails] Mapped article:', mappedArticle);
      setArticle(mappedArticle);
    } catch (err) {
      console.error('[ArticleDetails] Error fetching article:', err);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const formatDate = (dateString: string): string => {
    if (!dateString) {
      return '';
    }
    
    try {
      const date = new Date(dateString);
      
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
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      await Share.share({
        message: `${article.title}\n\n${article.excerpt}\n\nRead more: ${article.link}`,
        url: article.link,
      });
    } catch (err) {
      console.error('Error sharing article:', err);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !article) {
    return (
      <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Article not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchArticle}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const formattedDate = formatDate(article.published_date);

  return (
    <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Article
          </Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name="square.and.arrow.up"
              android_material_icon_name="share"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          {article.featured_image_url && (
            <Image
              source={{ uri: article.featured_image_url }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
          )}

          <View style={styles.contentContainer}>
            <Text style={styles.title}>{article.title || 'Untitled'}</Text>

            <View style={styles.metaContainer}>
              {formattedDate && <Text style={styles.dateText}>{formattedDate}</Text>}
              <Text style={styles.authorText}>{article.author}</Text>
            </View>

            <Text style={styles.content}>{article.content}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
