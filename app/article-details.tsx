
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
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { colors } from '@/styles/commonStyles';

// WordPress REST API response format
interface WordPressPost {
  id: number;
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

// Helper function to strip HTML tags for simple rendering
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0015',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  date: {
    fontSize: 14,
    color: '#8b7ab8',
    marginBottom: 24,
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch directly from WordPress REST API
      const response = await fetch(`https://yohitradio.com/wp-json/wp/v2/posts/${id}?_embed`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const wpPost: WordPressPost = await response.json();
      console.log('Fetched WordPress post:', wpPost);
      
      // Map WordPress post to Article format for UI
      const mappedArticle: Article = {
        id: String(wpPost.id),
        title: wpPost.title?.rendered ?? '',
        excerpt: stripHtml(wpPost.excerpt?.rendered ?? ''),
        content: wpPost.content?.rendered ?? '',
        featured_image_url: wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null,
        published_date: wpPost.date ?? '',
        author: 'Yo Hit Radio',
        created_at: wpPost.date ?? '',
        link: wpPost.link ?? '',
      };
      
      console.log('Mapped article:', mappedArticle);
      setArticle(mappedArticle);
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
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
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      await Share.share({
        message: `${article.title}\n\n${article.link}`,
        url: article.link,
      });
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !article) {
    return (
      <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Article not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const formattedDate = formatDate(article.published_date);

  return (
    <LinearGradient colors={['#1a0033', '#0a0015']} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <IconSymbol 
              ios_icon_name="square.and.arrow.up" 
              android_material_icon_name="share"
              size={20} 
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
            {formattedDate && (
              <Text style={styles.date}>{formattedDate}</Text>
            )}
            <Text style={styles.content}>
              {stripHtml(article.content) || 'No content available'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
