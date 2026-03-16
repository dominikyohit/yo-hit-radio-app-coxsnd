
import React, { useEffect } from "react";
import { WidgetProvider } from "@/contexts/WidgetContext";
import "react-native-reanimated";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { useNetworkState } from "expo-network";
import { useColorScheme, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import { Stack, router } from "expo-router";
import { useFonts } from "expo-font";
import { AuthProvider } from "@/contexts/AuthContext";
import { OneSignal } from "react-native-onesignal";
import AudioManager from "@/utils/audioManager";

SplashScreen.preventAutoHideAsync();

// Initialize OneSignal
OneSignal.initialize("41c0200e-69a3-4e4d-bc0d-0a53d0f6e65a");
OneSignal.Notifications.requestPermission(true);
console.log("[OneSignal] Initialized with App ID: 41c0200e-69a3-4e4d-bc0d-0a53d0f6e65a and permission requested");

const CustomDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#000000",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const networkState = useNetworkState();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Initialize audio manager for background playback
  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioManager = AudioManager.getInstance();
        await audioManager.initialize();
        console.log('[App] Audio manager initialized for background playback');
      } catch (error) {
        console.error('[App] Failed to initialize audio manager:', error);
      }
    };
    initAudio();
  }, []);

  useEffect(() => {
    if (
      networkState.isConnected === false ||
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "No Internet Connection",
        "Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : DefaultTheme}
      >
        <AuthProvider>
          <WidgetProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
              <Stack.Screen
                name="article-details"
                options={{
                  headerShown: false,
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="event-details"
                options={{
                  headerShown: false,
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="auth"
                options={{
                  headerShown: false,
                  presentation: "modal",
                }}
              />
            </Stack>
            <StatusBar style="light" />
          </WidgetProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
