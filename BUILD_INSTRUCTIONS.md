
# Yo Hit Radio - Build Instructions

## ✅ Project Configuration Complete

The project is now properly configured for **react-native-track-player** with true background audio playback.

### ⚠️ IMPORTANT: Custom Development Build Required

**react-native-track-player** is a native module that requires a custom development build. It will **NOT** work in Expo Go preview.

---

## 📱 Testing on Android Device (Development Build)

### Prerequisites
1. Install EAS CLI globally (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

### Build Development APK

Run this command to create a development build APK:

```bash
eas build --platform android --profile development
```

**What this does:**
- Creates a custom development client with react-native-track-player linked
- Generates an APK file you can install on your Android device
- Enables live reloading and debugging via Metro bundler

**After the build completes:**
1. Download the APK from the EAS Build dashboard link
2. Install it on your Android device
3. Run `npx expo start --dev-client` in your project directory
4. Open the app on your device and it will connect to Metro bundler
5. You can now test background audio playback!

---

## 🚀 Production Builds

### Android APK (for internal testing/distribution)

```bash
eas build --platform android --profile preview
```

This creates a standalone APK that doesn't require Metro bundler.

### Android AAB (for Google Play Store)

```bash
eas build --platform android --profile production
```

This creates an Android App Bundle (.aab) file for Play Store submission.

---

## 🎵 Background Audio Features

Once you have a custom build installed, the app will support:

### ✅ Android
- **Media notification** with play/pause/stop controls
- **Lock screen controls** visible when device is locked
- **Foreground service** keeps audio playing even when:
  - App is in background
  - User switches to another app (WhatsApp, Facebook, etc.)
  - Screen turns off
  - Device sleeps/hibernates
- **Bluetooth/headphone controls** work
- **Car audio system integration**

### ✅ iOS
- **Lock screen controls** with Now Playing metadata
- **Control Center integration**
- **Background audio** continues when:
  - App is in background
  - Screen is locked
  - User switches apps
- **Bluetooth/headphone controls** work
- **CarPlay integration** (if configured)

---

## 🔧 Configuration Files

The following files have been configured for react-native-track-player:

### `app.json`
- Added `react-native-track-player` plugin
- Added Android permissions: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`
- Configured iOS `UIBackgroundModes: ["audio"]`

### `eas.json`
- `development` profile: Creates development client APK
- `preview` profile: Creates standalone APK for testing
- `production` profile: Creates AAB for Play Store

### `utils/audioManager.ts`
- Singleton class managing TrackPlayer
- Handles setup, playback, pause, stop, metadata updates
- Configured for background playback with `stopWithApp: false`

### `service.ts`
- Background service handling remote control events
- Responds to play/pause/stop from notification and lock screen

### `index.ts`
- Registers TrackPlayer playback service on app startup
- Only registers on native platforms (not web)

---

## 🐛 Troubleshooting

### "TrackPlayer is undefined" error
- This means you're running in Expo Go or web environment
- Solution: Build a custom development client using `eas build --platform android --profile development`

### Audio stops when app goes to background
- Make sure you've installed the custom build (not Expo Go)
- Check that Android battery optimization is disabled for the app:
  - Settings → Apps → Yo Hit Radio → Battery → Unrestricted

### Build fails
- Make sure you're logged in: `eas login`
- Check that `app.json` has the `react-native-track-player` plugin configured
- Try clearing cache: `eas build --platform android --profile development --clear-cache`

---

## 📝 Summary

1. **Expo Go preview will NOT work** - this is expected and correct
2. **Use EAS Build** to create custom development builds for testing
3. **Background audio will work** once you have a custom build installed
4. **All UI, branding, navigation, and stream URL remain unchanged**

---

## 🎯 Next Steps

1. Run `eas build --platform android --profile development`
2. Wait for build to complete (check EAS dashboard)
3. Download and install APK on your Android device
4. Run `npx expo start --dev-client` in project directory
5. Open app on device and test background playback!

The radio will now continue playing when you:
- Press the home button
- Open WhatsApp, Facebook, or any other app
- Lock your phone
- Let the screen turn off

✅ **Configuration complete. Ready to build!**
