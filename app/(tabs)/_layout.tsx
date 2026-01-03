
import React from 'react';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="house.fill" android_material_icon_name="home" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="newspaper.fill" android_material_icon_name="article" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-releases"
        options={{
          title: 'New Releases',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="music.note" android_material_icon_name="music-note" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="top10"
        options={{
          title: 'Top 10',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="chart.bar.fill" android_material_icon_name="bar-chart" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
