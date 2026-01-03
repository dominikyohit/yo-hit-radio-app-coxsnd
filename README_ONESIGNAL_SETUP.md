
# 🔔 OneSignal Push Notifications Setup Guide

This guide will help you set up OneSignal push notifications for the Yo Hit Radio app, including automatic notifications when WordPress posts are published.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [OneSignal Dashboard Setup](#onesignal-dashboard-setup)
3. [iOS Configuration](#ios-configuration)
4. [Android Configuration](#android-configuration)
5. [App Configuration](#app-configuration)
6. [WordPress Integration](#wordpress-integration)
7. [Testing Push Notifications](#testing-push-notifications)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

- OneSignal account (free): https://onesignal.com
- Apple Developer Account (for iOS push notifications)
- Firebase/Google Cloud account (for Android push notifications)
- WordPress site with admin access
- EAS CLI installed: `npm install -g eas-cli`

---

## 🎯 OneSignal Dashboard Setup

### Step 1: Create OneSignal App

1. Go to https://app.onesignal.com
2. Click **"New App/Website"**
3. Enter app name: **"Yo Hit Radio"**
4. Select **"Mobile App"** as platform
5. Click **"Create"**

### Step 2: Get Your App ID

1. After creating the app, go to **Settings > Keys & IDs**
2. Copy the **"OneSignal App ID"** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Save this for later - you'll need it in multiple places

### Step 3: Get REST API Key

1. In the same **Settings > Keys & IDs** page
2. Copy the **"REST API Key"**
3. Save this for WordPress integration

---

## 🍎 iOS Configuration

### Step 1: Generate APNs Certificate or Key

**Option A: APNs Auth Key (Recommended - Easier)**

1. Go to https://developer.apple.com/account/resources/authkeys/list
2. Click **"+"** to create a new key
3. Enter a name: "Yo Hit Radio Push Notifications"
4. Check **"Apple Push Notifications service (APNs)"**
5. Click **"Continue"** and **"Register"**
6. Download the `.p8` file (you can only download once!)
7. Note your **Key ID** and **Team ID**

**Option B: APNs Certificate (Traditional)**

1. Go to https://developer.apple.com/account/resources/certificates/list
2. Click **"+"** to create a new certificate
3. Select **"Apple Push Notification service SSL (Sandbox & Production)"**
4. Select your App ID: `com.yohitradio.app`
5. Follow instructions to create a Certificate Signing Request (CSR)
6. Upload CSR and download the certificate
7. Open certificate in Keychain Access
8. Export as `.p12` file with a password

### Step 2: Upload to OneSignal

1. In OneSignal dashboard, go to **Settings > Platforms**
2. Click **"Apple iOS"**
3. Upload your `.p8` key or `.p12` certificate
4. Enter required details (Key ID, Team ID, or certificate password)
5. Click **"Save"**

---

## 🤖 Android Configuration

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Enter project name: **"Yo Hit Radio"**
4. Follow the setup wizard

### Step 2: Add Android App to Firebase

1. In Firebase console, click **"Add app"** > **"Android"**
2. Enter package name: `com.yohitradio.app`
3. Download `google-services.json`
4. Place it in your project root (same level as `app.json`)

### Step 3: Get Firebase Server Key

1. In Firebase console, go to **Project Settings** (gear icon)
2. Go to **"Cloud Messaging"** tab
3. Copy the **"Server key"**

### Step 4: Configure OneSignal

1. In OneSignal dashboard, go to **Settings > Platforms**
2. Click **"Google Android"**
3. Paste your **Firebase Server Key**
4. Click **"Save"**

---

## ⚙️ App Configuration

### Step 1: Create .env File

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_ONESIGNAL_APP_ID=your-onesignal-app-id-here
```

Replace `your-onesignal-app-id-here` with your actual OneSignal App ID.

### Step 2: Update app.json

Open `app.json` and update the `extra.oneSignalAppId` field:

```json
{
  "expo": {
    "extra": {
      "oneSignalAppId": "your-onesignal-app-id-here"
    }
  }
}
```

### Step 3: Update eas.json

Open `eas.json` and add your OneSignal App ID to each build profile:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_ONESIGNAL_APP_ID": "your-onesignal-app-id-here"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_ONESIGNAL_APP_ID": "your-onesignal-app-id-here"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_ONESIGNAL_APP_ID": "your-onesignal-app-id-here"
      }
    }
  }
}
```

---

## 📝 WordPress Integration

### Step 1: Install OneSignal WordPress Plugin

1. Log in to your WordPress admin panel
2. Go to **Plugins > Add New**
3. Search for **"OneSignal Push Notifications"**
4. Click **"Install Now"** and then **"Activate"**

### Step 2: Configure OneSignal Plugin

1. Go to **Settings > OneSignal Push**
2. Click **"Setup"** or **"Configuration"**
3. Enter your **OneSignal App ID**
4. Enter your **REST API Key**
5. Click **"Save"**

### Step 3: Enable Automatic Notifications

1. In OneSignal WordPress settings, go to **"Automatic Notifications"**
2. Enable **"Automatically send a push notification when I publish a post"**
3. Configure notification settings:
   - **Title**: Use post title
   - **Message**: Use post excerpt
   - **URL**: Use post URL
4. Optional: Add custom fields for better targeting:
   - Add `article_id` or `post_id` to notification data
   - This allows the app to navigate directly to the article
5. Click **"Save Changes"**

### Step 4: Test WordPress Integration

1. Create a new WordPress post
2. Publish the post
3. Check OneSignal dashboard under **"Delivery"** to see if notification was sent
4. Check your device to see if notification was received

---

## 🏗️ Building the App

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Prebuild Native Code

```bash
npx expo prebuild --clean
```

This generates the native iOS and Android projects with OneSignal configured.

### Step 3: Build with EAS

**For iOS:**
```bash
eas build --platform ios --profile production
```

**For Android:**
```bash
eas build --platform android --profile production
```

**For both:**
```bash
eas build --platform all --profile production
```

### Step 4: Install on Device

After the build completes:
- **iOS**: Download from EAS or submit to TestFlight/App Store
- **Android**: Download APK or submit to Google Play

---

## 🧪 Testing Push Notifications

### Test 1: OneSignal Dashboard Test

1. Go to OneSignal dashboard
2. Click **"Messages"** > **"New Push"**
3. Enter a test message
4. Select **"Send to Test Device"** or **"Send to All Subscribers"**
5. Click **"Send Message"**
6. Check your device for the notification

### Test 2: WordPress Post Test

1. Create a new WordPress post
2. Add title, content, and featured image
3. Click **"Publish"**
4. Wait a few seconds
5. Check your device for the notification
6. Tap the notification - it should open the app and navigate to the article

### Test 3: Notification Settings Test

1. Open the app
2. Go to **Profile** tab (bottom right)
3. Toggle **"Push Notifications"** off
4. Send a test notification from OneSignal dashboard
5. You should NOT receive it
6. Toggle **"Push Notifications"** back on
7. Send another test notification
8. You should receive it

---

## ✅ Testing Checklist

Use this checklist to verify everything works:

### Initial Setup
- [ ] OneSignal App ID is configured in `.env`, `app.json`, and `eas.json`
- [ ] iOS APNs certificate/key is uploaded to OneSignal
- [ ] Android Firebase Server Key is configured in OneSignal
- [ ] `google-services.json` is in project root (Android)
- [ ] App builds successfully with EAS

### App Functionality
- [ ] App requests notification permission on first launch
- [ ] Permission prompt appears (iOS always, Android 13+)
- [ ] Device registers with OneSignal (check dashboard under "Audience")
- [ ] Notification settings toggle works in Profile tab
- [ ] Toggling off prevents notifications
- [ ] Toggling on enables notifications

### Notification Delivery
- [ ] Test notification from OneSignal dashboard arrives
- [ ] Notification appears when app is in foreground
- [ ] Notification appears when app is in background
- [ ] Notification appears when app is closed
- [ ] Notification sound/vibration works

### Notification Interaction
- [ ] Tapping notification opens the app
- [ ] Tapping notification navigates to correct screen
- [ ] WordPress post notifications navigate to article details
- [ ] Article content loads correctly after navigation

### WordPress Integration
- [ ] OneSignal WordPress plugin is installed and configured
- [ ] Publishing a new post triggers a notification
- [ ] Notification contains post title and excerpt
- [ ] Notification includes post featured image (if configured)
- [ ] Tapping notification opens the article in the app

---

## 🐛 Troubleshooting

### Issue: "OneSignal App ID not configured" warning

**Solution:**
- Check that `EXPO_PUBLIC_ONESIGNAL_APP_ID` is set in `.env`
- Check that `oneSignalAppId` is set in `app.json` under `expo.extra`
- Rebuild the app with `npx expo prebuild --clean`

### Issue: Notifications not received on iOS

**Solutions:**
1. Verify APNs certificate/key is uploaded to OneSignal
2. Check that `UIBackgroundModes` includes `remote-notification` in `app.json`
3. Ensure you're testing on a physical device (not simulator)
4. Check notification permissions in iOS Settings > Yo Hit Radio
5. Verify the app is built with EAS (not Expo Go)

### Issue: Notifications not received on Android

**Solutions:**
1. Verify Firebase Server Key is configured in OneSignal
2. Check that `google-services.json` is in project root
3. Ensure `POST_NOTIFICATIONS` permission is in `app.json` (Android 13+)
4. Check notification permissions in Android Settings > Apps > Yo Hit Radio
5. Verify the app is built with EAS (not Expo Go)

### Issue: WordPress notifications not sending

**Solutions:**
1. Verify OneSignal WordPress plugin is activated
2. Check that App ID and REST API Key are correct in WordPress settings
3. Enable "Automatic Notifications" in plugin settings
4. Check OneSignal dashboard under "Delivery" for error messages
5. Test with a simple post first (no custom fields)

### Issue: Notification received but app doesn't navigate

**Solutions:**
1. Check that notification includes `article_id` or `post_id` in additional data
2. Verify the article ID is correct and exists
3. Check app logs for navigation errors
4. Ensure `expo-router` is properly configured

### Issue: "Failed to initialize OneSignal" error

**Solutions:**
1. Check that `react-native-onesignal` is installed: `npm list react-native-onesignal`
2. Run `npx expo prebuild --clean` to regenerate native code
3. Check for conflicting notification libraries
4. Verify OneSignal plugin is in `app.json` plugins array

---

## 📚 Additional Resources

- **OneSignal Documentation**: https://documentation.onesignal.com/docs
- **OneSignal React Native SDK**: https://documentation.onesignal.com/docs/react-native-sdk-setup
- **OneSignal WordPress Plugin**: https://wordpress.org/plugins/onesignal-free-web-push-notifications/
- **Expo Push Notifications**: https://docs.expo.dev/push-notifications/overview/
- **EAS Build**: https://docs.expo.dev/build/introduction/

---

## 🎉 Success!

If you've completed all the steps and passed the testing checklist, your push notifications are fully configured! 

Users will now receive notifications when:
- New WordPress posts are published
- You send manual notifications from OneSignal dashboard
- Any other events you configure in the future

The app will automatically navigate users to the relevant content when they tap notifications.

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check OneSignal dashboard for delivery errors
2. Review app logs for error messages
3. Verify all configuration values are correct
4. Test on multiple devices (iOS and Android)
5. Contact OneSignal support: https://onesignal.com/support

---

**Last Updated**: January 2025
**App Version**: 1.0.0
**OneSignal SDK Version**: 5.2.6
