
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="index">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="news" name="news">
        <Icon sf="newspaper.fill" />
        <Label>News</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="new-releases" name="new-releases">
        <Icon sf="music.note" />
        <Label>New Releases</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="top10" name="top10">
        <Icon sf="chart.bar.fill" />
        <Label>Top 10</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="events" name="events">
        <Icon sf="calendar" />
        <Label>Events</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
