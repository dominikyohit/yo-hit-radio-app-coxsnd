
# OneSignal Push Notifications Setup

## ✅ What Has Been Configured

1. **OneSignal SDK Installed**: `react-native-onesignal` and `onesignal-expo-plugin` packages added
2. **App Configuration Updated**: `app.json` configured with:
   - Android package name: `com.yohitradio.app`
   - OneSignal App ID: `41c0200e-69a3-4e4d-bc0d-0a53d0f6e65a`
   - OneSignal plugin added to plugins array
   - Google Services file path configured
3. **OneSignal Initialized**: In `app/_layout.tsx` with automatic permission request
4. **Console Logging**: Added confirmation log when OneSignal initializes

## 🚨 IMPORTANT: Required Action

### Replace the google-services.json File

The `google-services.json` file at the project root is currently a **placeholder**. You MUST replace it with your actual Firebase configuration file:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings → Your Apps → Android App
4. Download the `google-services.json` file
5. Replace the placeholder file at `./google-services.json` with your downloaded file

**The file must contain:**
- Your actual Firebase project credentials
- The package name: `com.yohitradio.app`

## 📱 Testing Push Notifications

### 1. Build and Run the App

For development:
```bash
npm run android
```

For production build:
```bash
npx expo prebuild
npx expo run:android
```

### 2. Verify OneSignal Initialization

Check the console logs for:
```
[OneSignal] Initialized with App ID: 41c0200e-69a3-4e4d-bc0d-0a53d0f6e65a and permission requested
```

### 3. Send a Test Notification

1. Go to [OneSignal Dashboard](https://app.onesignal.com/)
2. Navigate to Messages → New Push
3. Select your app
4. Create and send a test notification
5. The notification should appear on your Android device

## 🔧 Configuration Details

### OneSignal App ID
```
41c0200e-69a3-4e4d-bc0d-0a53d0f6e65a
```

### Android Package Name
```
com.yohitradio.app
```

### Files Modified
- `app.json` - Added Android package, Google Services file path, OneSignal plugin, and App ID
- `app/_layout.tsx` - Added OneSignal initialization at app startup
- `package.json` - Added OneSignal dependencies

### Files Created
- `google-services.json` - Placeholder (MUST BE REPLACED)
- `README_ONESIGNAL_SETUP.md` - This file

## 📚 Additional Features (Optional)

You can add more OneSignal features in your app:

### Handle Notification Clicks
```typescript
// In app/_layout.tsx or a dedicated hook
OneSignal.Notifications.addEventListener('click', (event) => {
  console.log('[OneSignal] Notification clicked:', event);
  // Navigate to specific screen based on notification data
});
```

### Set User Tags
```typescript
OneSignal.User.addTag("user_type", "premium");
```

### Get Player ID
```typescript
const playerId = OneSignal.User.pushSubscription.id;
console.log('[OneSignal] Player ID:', playerId);
```

## 🐛 Troubleshooting

### Notifications Not Received
1. Verify `google-services.json` is the actual Firebase file (not placeholder)
2. Check that FCM is enabled in Firebase Console
3. Verify the package name matches: `com.yohitradio.app`
4. Check OneSignal Dashboard for device subscription
5. Ensure notification permissions are granted on device

### Build Errors
1. Run `npx expo prebuild --clean` to regenerate native folders
2. Verify all dependencies are installed: `npm install`
3. Check that `google-services.json` is valid JSON

## 📖 Documentation

- [OneSignal React Native SDK](https://documentation.onesignal.com/docs/react-native-sdk-setup)
- [OneSignal Expo Plugin](https://github.com/OneSignal/onesignal-expo-plugin)
- [Firebase Console](https://console.firebase.google.com/)

## ✅ Next Steps

1. **Replace google-services.json** with your actual Firebase configuration file
2. **Rebuild the app** using `npx expo prebuild` and `npx expo run:android`
3. **Test notifications** from OneSignal Dashboard
4. **Verify** the console log confirms OneSignal initialization
5. **Deploy** your app and start sending push notifications!
