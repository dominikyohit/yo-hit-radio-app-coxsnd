
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Define the tabs configuration
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'news',
      route: '/(tabs)/news',
      icon: 'newspaper',
      label: 'News',
    },
    {
      name: 'new-releases',
      route: '/(tabs)/new-releases',
      icon: 'music.note',
      label: 'New Releases',
    },
    {
      name: 'shows',
      route: '/(tabs)/shows',
      icon: 'mic',
      label: 'Shows',
    },
    {
      name: 'events',
      route: '/(tabs)/events',
      icon: 'calendar',
      label: 'Events',
    },
    {
      name: 'contacts',
      route: '/(tabs)/contacts',
      icon: 'phone',
      label: 'Contacts',
    },
  ];

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none', // Remove fade animation to prevent black screen flash
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="news" name="news" />
        <Stack.Screen key="new-releases" name="new-releases" />
        <Stack.Screen key="shows" name="shows" />
        <Stack.Screen key="events" name="events" />
        <Stack.Screen key="contacts" name="contacts" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
