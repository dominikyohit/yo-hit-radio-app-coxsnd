
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function ContactsScreen() {
  const handleEmail = () => {
    Linking.openURL('mailto:info@yohitradio.com');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleWebsite = () => {
    Linking.openURL('https://yohitradio.com');
  };

  return (
    <LinearGradient colors={['#1a0033', '#2d1b4e', '#1a0033']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Contact Us</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contactCard}>
            <Text style={styles.sectionTitle}>Get in Touch</Text>
            <Text style={styles.sectionDescription}>
              Have questions or feedback? We'd love to hear from you!
            </Text>

            <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="envelope.fill" 
                  android_material_icon_name="email" 
                  size={24} 
                  color="#FFD700" 
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>info@yohitradio.com</Text>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="arrow-forward" 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={handlePhone}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="phone.fill" 
                  android_material_icon_name="phone" 
                  size={24} 
                  color="#FFD700" 
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>+1 (234) 567-890</Text>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="arrow-forward" 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="globe" 
                  android_material_icon_name="language" 
                  size={24} 
                  color="#FFD700" 
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>yohitradio.com</Text>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="arrow-forward" 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.socialCard}>
            <Text style={styles.sectionTitle}>Follow Us</Text>
            <Text style={styles.sectionDescription}>
              Stay connected on social media
            </Text>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <IconSymbol 
                  ios_icon_name="logo.facebook" 
                  android_material_icon_name="facebook" 
                  size={28} 
                  color="#FFD700" 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <IconSymbol 
                  ios_icon_name="logo.twitter" 
                  android_material_icon_name="share" 
                  size={28} 
                  color="#FFD700" 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <IconSymbol 
                  ios_icon_name="logo.instagram" 
                  android_material_icon_name="photo-camera" 
                  size={28} 
                  color="#FFD700" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  contactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    marginBottom: 20,
  },
  socialCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
});
