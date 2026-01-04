
import React from "react";
import { FlatList, StyleSheet, View, Image } from "react-native";
import { useTheme } from "@react-navigation/native";
import { modalDemos } from "@/components/homeData";
import { DemoCard } from "@/components/DemoCard";

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/821e24d8-2a3e-485e-8842-32518269360d.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <FlatList
        data={modalDemos}
        renderItem={({ item }) => <DemoCard item={item} />}
        keyExtractor={(item) => item.route}
        contentContainerStyle={styles.listContainer}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logo: {
    width: 150,
    height: 60,
  },
  listContainer: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
});
