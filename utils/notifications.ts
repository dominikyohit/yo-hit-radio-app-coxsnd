
import { Platform } from 'react-native';
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';
import { router } from 'expo-router';

export class NotificationService {
  private static initialized = false;

  /**
   * Initialize OneSignal with app ID from environment
   */
  static initialize() {
    if (this.initialized) {
      console.log('OneSignal already initialized');
      return;
    }

    const appId = Constants.expoConfig?.extra?.oneSignalAppId || process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

    if (!appId) {
      console.warn('⚠️ OneSignal App ID not configured. Push notifications will not work.');
      console.warn('Please set EXPO_PUBLIC_ONESIGNAL_APP_ID in your .env file or app.json');
      return;
    }

    try {
      // Initialize OneSignal
      OneSignal.initialize(appId);

      // Request permission (iOS will show prompt, Android 13+ will show prompt)
      OneSignal.Notifications.requestPermission(true);

      // Set up notification handlers
      this.setupNotificationHandlers();

      this.initialized = true;
      console.log('✅ OneSignal initialized successfully with App ID:', appId);
    } catch (error) {
      console.error('❌ Failed to initialize OneSignal:', error);
    }
  }

  /**
   * Set up notification event handlers
   */
  private static setupNotificationHandlers() {
    // Handle notification opened (user tapped notification)
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('📱 Notification clicked:', event);
      
      try {
        const data = event.notification.additionalData;
        
        // Handle navigation based on notification data
        if (data) {
          // If notification contains article_id, navigate to article details
          if (data.article_id || data.articleId) {
            const articleId = data.article_id || data.articleId;
            console.log('Navigating to article:', articleId);
            router.push({
              pathname: '/article-details',
              params: { id: articleId }
            });
          }
          // If notification contains post_id (WordPress), navigate to article details
          else if (data.post_id || data.postId) {
            const postId = data.post_id || data.postId;
            console.log('Navigating to WordPress post:', postId);
            router.push({
              pathname: '/article-details',
              params: { id: postId }
            });
          }
          // If notification contains a link, you could open it in a browser
          else if (data.link || data.url) {
            console.log('Notification contains link:', data.link || data.url);
            // Optionally open in browser or navigate to news tab
            router.push('/(tabs)/news');
          }
          // Default: navigate to news tab
          else {
            console.log('No specific navigation data, going to news tab');
            router.push('/(tabs)/news');
          }
        } else {
          // No additional data, just go to news tab
          console.log('No notification data, going to news tab');
          router.push('/(tabs)/news');
        }
      } catch (error) {
        console.error('Error handling notification click:', error);
        // Fallback to news tab
        router.push('/(tabs)/news');
      }
    });

    // Handle notification received in foreground
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      console.log('📬 Notification received in foreground:', event);
      // You can prevent the notification from displaying or modify it
      // event.preventDefault(); // Prevents notification from showing
      event.getNotification().display(); // Shows the notification
    });
  }

  /**
   * Check if user has granted notification permission
   */
  static async hasPermission(): Promise<boolean> {
    try {
      return await OneSignal.Notifications.getPermissionAsync();
    } catch (error) {
      console.error('Failed to check notification permission:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      return await OneSignal.Notifications.requestPermission(true);
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Enable or disable push notifications
   */
  static setNotificationsEnabled(enabled: boolean) {
    try {
      if (enabled) {
        OneSignal.Notifications.requestPermission(true);
      } else {
        OneSignal.User.pushSubscription.optOut();
      }
      console.log(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to set notifications enabled:', error);
    }
  }

  /**
   * Get the OneSignal player ID (device identifier)
   */
  static async getPlayerId(): Promise<string | null> {
    try {
      const deviceState = await OneSignal.User.pushSubscription.getIdAsync();
      return deviceState;
    } catch (error) {
      console.error('Failed to get OneSignal player ID:', error);
      return null;
    }
  }

  /**
   * Add tags to user for segmentation
   * Example: NotificationService.addTags({ user_type: 'premium', interests: 'news' })
   */
  static addTags(tags: Record<string, string>) {
    try {
      OneSignal.User.addTags(tags);
      console.log('Tags added:', tags);
    } catch (error) {
      console.error('Failed to add tags:', error);
    }
  }

  /**
   * Remove tags from user
   */
  static removeTags(keys: string[]) {
    try {
      OneSignal.User.removeTags(keys);
      console.log('Tags removed:', keys);
    } catch (error) {
      console.error('Failed to remove tags:', error);
    }
  }

  /**
   * Set external user ID (for linking with your backend)
   */
  static setExternalUserId(userId: string) {
    try {
      OneSignal.login(userId);
      console.log('External user ID set:', userId);
    } catch (error) {
      console.error('Failed to set external user ID:', error);
    }
  }

  /**
   * Remove external user ID
   */
  static removeExternalUserId() {
    try {
      OneSignal.logout();
      console.log('External user ID removed');
    } catch (error) {
      console.error('Failed to remove external user ID:', error);
    }
  }
}
