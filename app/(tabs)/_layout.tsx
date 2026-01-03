
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Define the tabs configuration for Yo Hit Radio
  const tabs: TabBarItem[] = [
    {
      name: 'index',
      route: '/(tabs)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'news',
      route: '/(tabs)/news',
      icon: 'article',
      label: 'News',
    },
    {
      name: 'top10',
      route: '/(tabs)/top10',
      icon: 'music-note',
      label: 'Top 10',
    },
    {
      name: 'events',
      route: '/(tabs)/events',
      icon: 'event',
      label: 'Events',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="index" name="index" />
        <Stack.Screen key="news" name="news" />
        <Stack.Screen key="top10" name="top10" />
        <Stack.Screen key="events" name="events" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} containerWidth={400} />
    </>
  );
}
