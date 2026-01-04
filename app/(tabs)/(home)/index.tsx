
import React, { useState, useEffect } from "react";
import { FlatList, StyleSheet, View, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import { modalDemos } from "@/components/homeData";
import { DemoCard } from "@/components/DemoCard";

const ZENO_API_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/hmc38e';
const METADATA_REFRESH_INTERVAL = 7000; // 7 seconds

export default function HomeScreen() {
  const theme = useTheme();
  const [artist, setArtist] = useState<string | null>(null);
  const [track, setTrack] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(ZENO_API_URL);
        const data = await response.json();
        
        setArtist(data.streamTitle || data.artist || null);
        setTrack(data.title || null);
      } catch (error) {
        console.error('Failed to fetch Zeno metadata:', error);
        setArtist(null);
        setTrack(null);
      }
    };

    fetchMetadata();
    const intervalId = setInterval(fetchMetadata, METADATA_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  const displayText = artist || track 
    ? `${artist || ''}\n${track || ''}`.trim()
    : 'Yo Hit Radio – Live Stream';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={modalDemos}
        renderItem={({ item }) => <DemoCard item={item} />}
        keyExtractor={(item) => item.route}
        contentContainerStyle={styles.listContainer}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.nowPlayingCard}>
            <Text style={styles.nowPlayingText}>{displayText}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  nowPlayingCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nowPlayingText: {
    color: '#fff',
    fontSize: 14,
  },
});
