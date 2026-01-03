
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

interface WordPressChart {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url?: string;
    }[];
  };
}

export default function ChartDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [chart, setChart] = useState<WordPressChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChart = useCallback(async () => {
    if (!id) {
      console.log('No chart ID provided');
      return;
    }
    
    try {
      setError(null);
      console.log('Fetching chart details for ID:', id);
      const response = await fetch(
        `https://yohitradio.com/wp-json/wp/v2/chart/${id}?_embed=1`
      );
      if (!response.ok) throw new Error('Failed to fetch chart');
      const data = await response.json();
      console.log('Chart details received:', data);
      setChart(data);
    } catch (err) {
      console.error('Error fetching chart details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color="#FFD700" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Chart Details</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading chart…</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  if (error || !chart) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color="#FFD700" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Chart Details</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={styles.errorContainer}>
              <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={48} color="#FFD700" />
              <Text style={styles.errorText}>{error || 'Chart not found'}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchChart}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  const featuredImageUrl = chart._embedded?.['wp:featuredmedia']?.[0]?.source_url;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color="#FFD700" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chart Details</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>{chart.title.rendered}</Text>
              
              {featuredImageUrl && (
                <Image
                  source={{ uri: featuredImageUrl }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.contentContainer}>
                <RenderHtml
                  contentWidth={width - 48}
                  source={{ html: chart.content.rendered }}
                  tagsStyles={{
                    body: { color: colors.text, fontSize: 16, lineHeight: 24 },
                    p: { marginBottom: 12, color: colors.text },
                    h1: { color: '#FFD700', marginBottom: 12 },
                    h2: { color: '#FFD700', marginBottom: 10 },
                    h3: { color: '#FFD700', marginBottom: 8 },
                    a: { color: '#64B5F6' },
                    li: { color: colors.text, marginBottom: 8 },
                  }}
                />
              </View>
            </View>
          </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  chartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuredImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  contentContainer: {
    marginTop: 8,
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
});
