
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
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect, useCallback } from 'react';
import { colors } from '@/styles/commonStyles';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

export default function ArticleDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://yohitradio.com/wp-json/wp/v2/posts/${id}?_embed=1`
      );
      const data: WordPressPost = await response.json();

      const transformedArticle: Article = {
        id: data.id.toString(),
        title: stripHtml(data.title.rendered),
        excerpt: stripHtml(data.excerpt.rendered),
        content: data.content.rendered,
        featured_image_url:
          data._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
        published_date: data.date,
        author: 'Yo Hit Radio',
        created_at: data.date,
        link: data.link,
      };

      setArticle(transformedArticle);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id, fetchArticle]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({
        message: `${article.title}\n\n${article.link}`,
        url: article.link,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <Stack.Screen
            options={{
              headerShown: true,
              headerTransparent: true,
              headerTitle: '',
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <IconSymbol name="chevron.left" size={24} color={colors.text} />
                </TouchableOpacity>
              ),
            }}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!article) {
    return (
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <Stack.Screen
            options={{
              headerShown: true,
              headerTransparent: true,
              headerTitle: '',
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <IconSymbol name="chevron.left" size={24} color={colors.text} />
                </TouchableOpacity>
              ),
            }}
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Article not found</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <IconSymbol name="chevron.left" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                <IconSymbol name="square.and.arrow.up" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {article.featured_image_url && (
            <Image source={{ uri: article.featured_image_url }} style={styles.featuredImage} />
          )}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{article.title}</Text>
            <Text style={styles.date}>{formatDate(article.published_date)}</Text>
            <View style={styles.htmlContent}>
              <Text style={styles.contentText}>{stripHtml(article.content)}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  featuredImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 36,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  htmlContent: {
    marginTop: 8,
  },
  contentText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
});
