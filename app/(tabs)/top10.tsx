
import React, { useState, useEffect, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

const LATEST_CHART_URL = 'https://yohitradio.com/wp-json/wp/v2/chart?per_page=1&order=desc&orderby=date&_embed=1';

export default function Top10Screen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [chart, setChart] = useState<WordPressChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLatestChart = useCallback(async () => {
    try {
      setError(null);
      console.log('Fetching latest chart from WordPress...');
      const response = await fetch(LATEST_CHART_URL);
      if (!response.ok) throw new Error('Failed to fetch chart');
      const data = await response.json();
      console.log('Chart data received:', data);
      if (data && data.length > 0) {
        setChart(data[0]);
      } else {
        setError('No charts available');
      }
    } catch (err) {
      console.error('Error fetching chart:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestChart();
  }, [fetchLatestChart]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLatestChart();
  }, [fetchLatestChart]);

  const handleRefresh = () => {
    setLoading(true);
    fetchLatestChart();
  };

  const handleAllCharts = () => {
    router.push('/all-charts');
  };

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Top 10</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading Top 10…</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error && !chart) {
    return (
      <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Top 10</Text>
          </View>
          <View style={styles.errorContainer}>
            <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={48} color="#FFD700" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const featuredImageUrl = chart?._embedded?.['wp:featuredmedia']?.[0]?.source_url;

  return (
    <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Top 10</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>This Week</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={handleRefresh}>
              <IconSymbol ios_icon_name="arrow.clockwise" android_material_icon_name="refresh" size={20} color="#FFD700" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.allChartsButton} onPress={handleAllCharts}>
              <Text style={styles.allChartsButtonText}>All Charts</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
              colors={['#FFD700']}
            />
          }
        >
          {chart && (
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
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  badge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allChartsButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  allChartsButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
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
