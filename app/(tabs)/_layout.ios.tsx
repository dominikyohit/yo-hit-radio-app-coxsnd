
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
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
      <NativeTabs.Trigger key="shows" name="shows">
        <Icon sf="mic.fill" />
        <Label>Shows</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="events" name="events">
        <Icon sf="calendar" />
        <Label>Events</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="contacts" name="contacts">
        <Icon sf="phone.fill" />
        <Label>Contacts</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
