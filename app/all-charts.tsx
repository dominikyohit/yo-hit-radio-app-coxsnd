
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

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

const ALL_CHARTS_URL = 'https://yohitradio.com/wp-json/wp/v2/chart?per_page=20&order=desc&orderby=date&_embed=1';

export default function AllChartsScreen() {
  const router = useRouter();
  const [charts, setCharts] = useState<WordPressChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllCharts = useCallback(async () => {
    try {
      setError(null);
      console.log('Fetching all charts from WordPress...');
      const response = await fetch(ALL_CHARTS_URL);
      if (!response.ok) throw new Error('Failed to fetch charts');
      const data = await response.json();
      console.log('All charts data received:', data.length, 'charts');
      setCharts(data);
    } catch (err) {
      console.error('Error fetching charts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load charts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCharts();
  }, [fetchAllCharts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllCharts();
  }, [fetchAllCharts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleChartPress = (chart: WordPressChart) => {
    router.push({
      pathname: '/chart-details',
      params: { id: chart.id.toString() },
    });
  };

  const renderChartItem = ({ item }: { item: WordPressChart }) => {
    const thumbnailUrl = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;

    return (
      <TouchableOpacity
        style={styles.chartItem}
        onPress={() => handleChartPress(item)}
        activeOpacity={0.7}
      >
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
            <IconSymbol ios_icon_name="music.note.list" android_material_icon_name="music-note" size={32} color="#FFD700" />
          </View>
        )}
        <View style={styles.chartInfo}>
          <Text style={styles.chartItemTitle} numberOfLines={2}>
            {item.title.rendered}
          </Text>
          <Text style={styles.chartDate}>{formatDate(item.date)}</Text>
        </View>
        <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={20} color="#FFD700" />
      </TouchableOpacity>
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
                <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color="#FFD700" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>All Charts</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading charts…</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  if (error && charts.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color="#FFD700" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>All Charts</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={styles.errorContainer}>
              <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={48} color="#FFD700" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchAllCharts}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color="#FFD700" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>All Charts</Text>
            <View style={styles.placeholder} />
          </View>

          <FlatList
            data={charts}
            renderItem={renderChartItem}
            keyExtractor={(item) => item.id.toString()}
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
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderThumbnail: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartInfo: {
    flex: 1,
    marginRight: 8,
  },
  chartItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  chartDate: {
    fontSize: 14,
    color: 'rgba(227, 227, 227, 0.6)',
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
});
