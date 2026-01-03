
import { useTheme } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { View, Text, StyleSheet, ScrollView, Platform, Switch, Alert } from "react-native";
import { NotificationService } from "@/utils/notifications";
import { colors } from "@/styles/commonStyles";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a0033",
  },
  content: {
    padding: 20,
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
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: "#fff",
  },
  settingDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
});

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const enabled = await NotificationService.areNotificationsEnabled();
    setNotificationsEnabled(enabled);
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        await NotificationService.initialize();
        setNotificationsEnabled(true);
        Alert.alert(
          "Notifications Enabled",
          "You'll receive notifications when new articles are published."
        );
      } else {
        Alert.alert(
          "Permission Denied",
          "Please enable notifications in your device settings to receive updates."
        );
      }
    } else {
      setNotificationsEnabled(false);
      Alert.alert(
        "Notifications Disabled",
        "You won't receive push notifications anymore."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified when new articles are published
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: "#767577", true: "#FFD700" }}
              thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
