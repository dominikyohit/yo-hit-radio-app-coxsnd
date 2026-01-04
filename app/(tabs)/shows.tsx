
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface Show {
  time: string;
  title: string;
}

interface DaySchedule {
  day: string;
  shows: Show[];
}

const scheduleData: DaySchedule[] = [
  {
    day: 'Monday–Friday',
    shows: [
      { time: '00:00–04:00', title: 'Hit by Night' },
      { time: '04:00–06:00', title: 'Gospel Hits' },
      { time: '06:00–09:00', title: 'Morning Jam' },
      { time: '09:00–14:00', title: 'The Playlist Hits' },
      { time: '14:00–16:00', title: 'NextGen Vibes' },
      { time: '16:00–20:00', title: 'Hit Sou Hit' },
      { time: '20:00–22:00', title: 'Dominik Show' },
      { time: '22:00–00:00', title: 'Hit Sou Hit' },
    ],
  },
  {
    day: 'Saturday',
    shows: [
      { time: '00:00–04:00', title: 'Hit by Night' },
      { time: '04:00–07:00', title: 'Gospel Hits' },
      { time: '07:00–09:00', title: 'Morning Jam' },
      { time: '09:00–19:00', title: 'Hit Sou Hit' },
      { time: '19:00–00:00', title: 'Saturday Night Fever' },
    ],
  },
  {
    day: 'Sunday',
    shows: [
      { time: '00:00–04:00', title: 'Hit by Night' },
      { time: '04:00–07:00', title: 'Gospel Hits' },
      { time: '07:00–09:00', title: 'Morning Jam' },
      { time: '09:00–17:00', title: 'Hit Sou Hit' },
      { time: '17:00–00:00', title: 'Retro Hits' },
    ],
  },
];

export default function ShowsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#1a0033', '#2d1b4e', '#1a0033']}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={32}
              color="#FFD700"
            />
            <Text style={styles.title}>Programming Schedule</Text>
          </View>

          {scheduleData.map((daySchedule, index) => (
            <View key={index} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{daySchedule.day}</Text>
              </View>

              {daySchedule.shows.map((show, showIndex) => (
                <View key={showIndex} style={styles.showRow}>
                  <View style={styles.timeContainer}>
                    <IconSymbol
                      ios_icon_name="clock"
                      android_material_icon_name="access-time"
                      size={16}
                      color="#FFD700"
                    />
                    <Text style={styles.timeText}>{show.time}</Text>
                  </View>
                  <View style={styles.showTitleContainer}>
                    <Text style={styles.showTitle}>{show.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.footer} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a0033',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  dayHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.3)',
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  showRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8B8B8',
  },
  showTitleContainer: {
    flex: 1,
  },
  showTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    height: 20,
  },
});
