
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static notificationListener: any;
  private static responseListener: any;

  /**
   * Initialize push notifications
   */
  static async initialize() {
    try {
      console.log('Initializing push notifications...');
      
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return false;
      }

      // Get push token for Expo's push notification service
      if (Platform.OS !== 'web') {
        try {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
          });
          console.log('Expo Push Token:', token.data);
        } catch (error) {
          console.error('Error getting push token:', error);
        }
      }

      // Set up notification listeners
      this.setupListeners();

      console.log('Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Set up notification event listeners
   */
  private static setupListeners() {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      // Navigate to article details if article_id is present
      if (data?.article_id) {
        console.log('Navigating to article:', data.article_id);
        router.push(`/article-details?id=${data.article_id}`);
      }
    });
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Clean up listeners
   */
  static cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Schedule a local notification (for testing)
   */
  static async scheduleTestNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Yo Hit Radio 📻",
          body: 'New article published!',
          data: { article_id: '1' },
        },
        trigger: { seconds: 2 },
      });
      console.log('Test notification scheduled');
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  }
}
