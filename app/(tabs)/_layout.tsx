
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Define the tabs configuration - 6 tabs total
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
      name: 'new-releases',
      route: '/(tabs)/new-releases',
      icon: 'album',
      label: 'Releases',
    },
    {
      name: 'shows',
      route: '/(tabs)/shows',
      icon: 'radio',
      label: 'Shows',
    },
    {
      name: 'events',
      route: '/(tabs)/events',
      icon: 'event',
      label: 'Events',
    },
    {
      name: 'contacts',
      route: '/(tabs)/contacts',
      icon: 'contact-mail',
      label: 'Contact',
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
        <Stack.Screen name="index" />
        <Stack.Screen name="news" />
        <Stack.Screen name="new-releases" />
        <Stack.Screen name="shows" />
        <Stack.Screen name="events" />
        <Stack.Screen name="contacts" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
