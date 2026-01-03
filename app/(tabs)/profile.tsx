
import { useTheme } from "@react-navigation/native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { colors } from "@/styles/commonStyles";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a0033",
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 20,
  },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
    paddingBottom: 32,
  },
  version: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
});

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.profileIcon}>
            <IconSymbol
              ios_icon_name="radio"
              android_material_icon_name="radio"
              size={50}
              color="#FFD700"
            />
          </View>
          <Text style={styles.appName}>Yo Hit Radio</Text>
          <Text style={styles.tagline}>Your favorite hits, all day long</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Station</Text>
            <Text style={styles.infoValue}>Yo Hit Radio</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Stream Quality</Text>
            <Text style={styles.infoValue}>High Quality (128kbps)</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>
              {Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : "Web"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>🎵 Live Radio Streaming</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>📰 Latest News & Articles</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>🔥 Weekly Top 10 Chart</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>🎉 Upcoming Events</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
