
# 🔔 Push Notifications Setup Guide

This app uses **Expo Push Notifications** for sending push notifications to users. This guide explains how the system works and how to integrate it with WordPress.

---

## 📋 Overview

The app uses Expo's native push notification service, which is:
- ✅ **Free** - No third-party service fees
- ✅ **Simple** - No complex native configuration
- ✅ **Cross-platform** - Works on iOS, Android, and web
- ✅ **Integrated** - Built into Expo SDK

---

## 🚀 How It Works

1. **User opens the app** → App requests notification permission
2. **Permission granted** → App generates an Expo Push Token
3. **Token sent to backend** → Backend stores the token for the user
4. **WordPress publishes post** → Backend sends push notification via Expo API
5. **User receives notification** → Tapping opens the article in the app

---

## ⚙️ Current Implementation

### Frontend (Already Implemented)

The app includes a complete notification system in `utils/notifications.ts`:

- ✅ Permission requests (iOS & Android)
- ✅ Push token generation
- ✅ Notification listeners (foreground & background)
- ✅ Deep linking to articles when notification is tapped
- ✅ Settings toggle in Profile screen

### What's Needed: Backend Integration

To complete the push notification system, you need to:

1. **Store push tokens** when users grant permission
2. **Send notifications** when WordPress posts are published
3. **Use Expo Push API** to deliver notifications

---

## 🔧 Backend Setup (Required)

### Step 1: Store Push Tokens

When a user grants notification permission, the app generates an Expo Push Token. You need to store this token in your backend.

**Example token format:**
```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

**API Endpoint to Create:**
```
POST /api/notifications/register
Body: {
  "token": "ExponentPushToken[...]",
  "user_id": "optional-user-id"
}
```

### Step 2: Send Push Notifications

When a WordPress post is published, send a push notification to all registered tokens.

**Expo Push API:**
```
POST https://exp.host/--/api/v2/push/send
Headers: {
  "Content-Type": "application/json"
}
Body: {
  "to": "ExponentPushToken[...]",
  "title": "New Article Published!",
  "body": "Check out our latest post",
  "data": {
    "article_id": "123"
  }
}
```

**Multiple recipients:**
```json
{
  "to": [
    "ExponentPushToken[xxx]",
    "ExponentPushToken[yyy]",
    "ExponentPushToken[zzz]"
  ],
  "title": "New Article Published!",
  "body": "Check out our latest post",
  "data": {
    "article_id": "123"
  }
}
```

### Step 3: WordPress Integration

**Option A: WordPress Plugin (Recommended)**

Create a simple WordPress plugin that:
1. Hooks into `publish_post` action
2. Calls your backend API
3. Backend sends push notifications via Expo API

**Example WordPress code:**
```php
add_action('publish_post', 'send_push_notification_on_publish', 10, 2);

function send_push_notification_on_publish($post_id, $post) {
    // Get post data
    $title = get_the_title($post_id);
    $excerpt = get_the_excerpt($post_id);
    
    // Call your backend API
    $response = wp_remote_post('https://your-backend.com/api/notifications/send', [
        'body' => json_encode([
            'article_id' => $post_id,
            'title' => $title,
            'body' => $excerpt
        ]),
        'headers' => [
            'Content-Type' => 'application/json'
        ]
    ]);
}
```

**Option B: Webhook**

Configure WordPress to send a webhook to your backend when posts are published:
1. Install a webhook plugin (e.g., "WP Webhooks")
2. Configure webhook URL: `https://your-backend.com/api/notifications/wordpress-webhook`
3. Backend receives webhook and sends push notifications

---

## 🧪 Testing

### Test 1: Permission Request

1. Open the app for the first time
2. You should see a permission dialog
3. Grant permission
4. Check console logs for "Expo Push Token: ExponentPushToken[...]"

### Test 2: Manual Test Notification

The app includes a test notification feature. In `utils/notifications.ts`, call:

```typescript
NotificationService.scheduleTestNotification();
```

This schedules a local notification after 2 seconds.

### Test 3: Backend Test

Use the Expo Push Notification Tool to test:
1. Go to https://expo.dev/notifications
2. Enter your Expo Push Token
3. Enter a test message
4. Click "Send a Notification"
5. Check your device

### Test 4: WordPress Integration

1. Publish a new WordPress post
2. Backend should send push notification
3. Check device for notification
4. Tap notification → Should open article in app

---

## 📱 User Experience

### Profile Screen

Users can enable/disable notifications in the Profile tab:

- **Toggle ON** → Requests permission and registers token
- **Toggle OFF** → Unregisters token (backend should stop sending)

### Notification Behavior

- **App in foreground** → Shows in-app alert
- **App in background** → Shows system notification
- **App closed** → Shows system notification
- **Tap notification** → Opens app and navigates to article

---

## 🔒 Permissions

### iOS

- Automatically requests permission on first launch
- User can change in Settings > Yo Hit Radio > Notifications

### Android

- Android 13+ requires explicit permission request
- Earlier versions grant permission automatically
- User can change in Settings > Apps > Yo Hit Radio > Notifications

---

## 📊 Monitoring

### Expo Dashboard

View notification delivery stats:
1. Go to https://expo.dev
2. Select your project
3. Go to "Push Notifications" tab
4. View delivery rates, errors, and receipts

### Backend Logging

Log important events:
- Token registrations
- Notification sends
- Delivery failures
- User opt-outs

---

## 🐛 Troubleshooting

### Issue: "Permission denied"

**Solution:**
- User denied permission
- Ask user to enable in device settings
- Show helpful message in app

### Issue: "Invalid push token"

**Solution:**
- Token format must be `ExponentPushToken[...]`
- Regenerate token by calling `Notifications.getExpoPushTokenAsync()`
- Ensure `projectId` is set in `Constants.expoConfig.extra.eas.projectId`

### Issue: Notifications not received

**Solutions:**
1. Check token is valid and registered
2. Verify backend is sending to correct token
3. Check Expo dashboard for delivery errors
4. Ensure app is built with EAS (not Expo Go for production)

### Issue: Notification received but doesn't navigate

**Solutions:**
1. Check notification data includes `article_id`
2. Verify article ID is correct
3. Check app logs for navigation errors

---

## 🚀 Production Checklist

Before launching:

- [ ] Backend stores push tokens
- [ ] Backend sends notifications via Expo API
- [ ] WordPress integration is configured
- [ ] Tested on iOS physical device
- [ ] Tested on Android physical device
- [ ] Permission flow works correctly
- [ ] Deep linking to articles works
- [ ] Settings toggle works
- [ ] Monitoring/logging is set up
- [ ] Error handling is implemented

---

## 📚 Resources

- **Expo Push Notifications**: https://docs.expo.dev/push-notifications/overview/
- **Expo Push API**: https://docs.expo.dev/push-notifications/sending-notifications/
- **Expo Push Tool**: https://expo.dev/notifications
- **React Native Notifications**: https://reactnative.dev/docs/pushnotificationios

---

## 💡 Next Steps

1. **Implement backend endpoints** for token registration and notification sending
2. **Set up WordPress integration** to trigger notifications on post publish
3. **Test thoroughly** on both iOS and Android devices
4. **Monitor delivery rates** in Expo dashboard
5. **Optimize notification content** based on user engagement

---

**Last Updated**: January 2025
**Notification System**: Expo Push Notifications
**SDK Version**: expo-notifications ~0.30.5
