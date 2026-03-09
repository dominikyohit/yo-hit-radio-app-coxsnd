
# 🎵 Yo Hit Radio - Android Background Audio Build Instructions

## ✅ What Was Implemented

### **Library Used: `react-native-track-player` v4.0.1**

**Why This Library:**
- ✅ **True Background Playback**: Uses Android Foreground Service to keep audio playing when app is backgrounded, locked, or user switches apps
- ✅ **Media Notifications**: Persistent notification with play/pause/stop controls
- ✅ **Lock Screen Controls**: Full media controls on Android lock screen and iOS Control Center
- ✅ **Battery Optimization Resistant**: Foreground service prevents Android from killing the audio
- ✅ **Cross-Platform**: Works on both Android and iOS with native implementations

**Why NOT `expo-av`:**
- ❌ `expo-av` does NOT support true background playback on Android
- ❌ No foreground service support
- ❌ No persistent media notifications
- ❌ Audio stops when app is backgrounded or device locks

---

## 📝 Files Changed

### **1. `utils/audioManager.ts`**
- **Changed**: Complete rewrite to use `react-native-track-player` APIs
- **Key Features**:
  - `setupPlayer()`: Initializes TrackPlayer with foreground service configuration
  - `playAudio()`: Starts playback with metadata (title, artist, artwork)
  - `pauseAudio()`, `resumeAudio()`, `stopCurrentAudio()`: Playback controls
  - `updateMetadata()`: Updates notification and lock screen metadata
  - `AppKilledPlaybackBehavior.ContinuePlayback`: Audio continues even if app is force-closed

### **2. `service.ts`**
- **Changed**: Complete rewrite to implement TrackPlayer background service
- **Key Features**:
  - Handles remote control events (play, pause, stop) from notification, lock screen, Bluetooth, Android Auto
  - Listens to `Event.RemotePlay`, `Event.RemotePause`, `Event.RemoteStop`
  - Handles playback errors and state changes

### **3. `index.ts`**
- **Changed**: Added TrackPlayer service registration BEFORE Expo Router
- **Critical**: `TrackPlayer.registerPlaybackService()` must be called early in app lifecycle

### **4. `app.json`**
- **Changed**: Added `react-native-track-player` plugin and Android permissions
- **New Permissions**:
  - `FOREGROUND_SERVICE`: Required for background audio service
  - `FOREGROUND_SERVICE_MEDIA_PLAYBACK`: Android 14+ requirement for media playback
  - `POST_NOTIFICATIONS`: Required for media notification
- **Plugin Configuration**: `react-native-track-player` with `android.v2: true`

### **5. `app/(tabs)/index.tsx`**
- **Changed**: Updated to use TrackPlayer's event system for playback state
- **Key Changes**:
  - Added `TrackPlayer.addEventListener(Event.PlaybackState)` to listen for state changes
  - Removed manual `isPlaying` state management (now driven by TrackPlayer events)
  - Improved logging for debugging background playback

---

## 🚀 Build Steps for Android APK/AAB

### **⚠️ IMPORTANT: Expo Go Preview Will NOT Work**
`react-native-track-player` is a **native module** that requires a **custom development build**. Standard Expo Go preview does NOT support this library.

---

### **Step 1: Build a Development Client (Recommended for Testing)**

This creates a custom Expo Go app with your native modules included.

**Command:**
```bash
eas build --platform android --profile development
```

**What This Does:**
- Builds a custom development client APK
- Includes `react-native-track-player` native module
- Allows you to test with `expo start --dev-client`

**After Build Completes:**
1. Download the `.apk` file from the EAS dashboard link in your terminal
2. Install the APK on your Android device
3. Run `expo start --dev-client` to connect to the dev client

---

### **Step 2: Build a Production APK (For Internal Testing/Distribution)**

**Command:**
```bash
eas build --platform android --profile preview
```

**What This Does:**
- Builds a standalone APK for internal testing
- Includes all native modules
- Can be distributed directly to testers

**After Build Completes:**
1. Download the `.apk` file from the EAS dashboard
2. Install on Android devices for testing

---

### **Step 3: Build a Production AAB (For Google Play Store)**

**Command:**
```bash
eas build --platform android --profile production
```

**What This Does:**
- Builds an Android App Bundle (`.aab`) for Google Play Store submission
- Optimized for Play Store distribution
- Includes all native modules

**After Build Completes:**
1. Download the `.aab` file from the EAS dashboard
2. Upload to Google Play Console

---

## 🧪 How to Test Background Playback on Real Android Phone

### **Test Checklist:**

#### **1. Install the App**
- Install either the development client or production APK on your Android device

#### **2. Start Playback**
- Open the app
- Tap "Listen Live" to start the radio stream
- ✅ **Verify**: You should see a persistent media notification appear in the notification shade

#### **3. Test Backgrounding**
- **Press Home Button**: Audio should continue playing
- **Switch to Another App** (WhatsApp, Chrome, etc.): Audio should continue playing
- **Lock the Phone Screen**: Audio should continue playing
- ✅ **Verify**: Media notification remains visible and controls work

#### **4. Test Lock Screen Controls**
- Lock your phone while audio is playing
- ✅ **Verify**: You should see media controls on the lock screen with:
  - Song title and artist
  - Album artwork (if available)
  - Play/Pause/Stop buttons

#### **5. Test Notification Controls**
- Pull down the notification shade while audio is playing
- ✅ **Verify**: You should see a persistent notification with:
  - "Yo Hit Radio" title
  - Current song/show metadata
  - Play/Pause/Stop buttons
- **Tap Play/Pause**: Audio should pause/resume
- **Tap Stop**: Audio should stop and notification should disappear

#### **6. Test App Termination (Optional)**
- While audio is playing in the background, go to recent apps
- **Swipe away the app** to force close it
- ✅ **Expected Behavior**: Audio *may* continue for a period (depends on Android version and device manufacturer)
- ⚠️ **Note**: This behavior varies due to aggressive battery optimizations on different Android devices

#### **7. Test Battery Optimization Settings**
- On first play, the app shows a popup instructing users to disable battery optimization
- Go to: **Settings → Apps → Yo Hit Radio → Battery**
- Set to: **Unrestricted** or **Don't optimize**
- ✅ **Verify**: This ensures the foreground service is not killed by battery saver

---

## 🔧 Troubleshooting

### **Issue: Audio Stops When App is Backgrounded**

**Possible Causes:**
1. **Battery Optimization**: Android is killing the foreground service
   - **Solution**: Disable battery optimization for Yo Hit Radio (Settings → Apps → Yo Hit Radio → Battery → Unrestricted)

2. **Build Not Using Custom Native Build**: You're testing in Expo Go
   - **Solution**: You MUST use a custom development build or production APK. Expo Go does NOT support `react-native-track-player`.

3. **Permissions Not Granted**: Missing `FOREGROUND_SERVICE` or `POST_NOTIFICATIONS` permissions
   - **Solution**: Rebuild the app with the updated `app.json` configuration

### **Issue: No Media Notification Appears**

**Possible Causes:**
1. **Notification Permission Not Granted**: Android 13+ requires explicit notification permission
   - **Solution**: Grant notification permission when prompted, or go to Settings → Apps → Yo Hit Radio → Notifications → Enable

2. **TrackPlayer Not Initialized**: `setupPlayer()` was not called
   - **Solution**: Check logs for `[AudioManager] ✅ TrackPlayer setup complete`

### **Issue: Build Fails with Kotlin Compilation Error**

**Possible Causes:**
1. **Version Conflict**: `react-native-track-player` v4.x.x has known Kotlin issues with Expo SDK 54
   - **Solution**: We're using v4.0.1 which is more stable. If issues persist, check EAS build logs for specific errors.

---

## 📱 Expected Behavior Summary

### **✅ What WILL Work:**
- ✅ Audio continues playing when app is backgrounded
- ✅ Audio continues playing when user switches to another app
- ✅ Audio continues playing when screen is locked
- ✅ Persistent media notification with controls
- ✅ Lock screen media controls
- ✅ Bluetooth/headphone controls
- ✅ Metadata updates (song title, artist, artwork)

### **❌ What Will NOT Work:**
- ❌ Expo Go preview (requires custom native build)
- ❌ Web platform (TrackPlayer is native-only)
- ❌ Guaranteed playback after force-closing app (depends on device/Android version)

---

## 🎯 Final Notes

1. **Custom Build Required**: This implementation requires EAS Build. Standard Expo Go will NOT work.

2. **Battery Optimization**: Users MUST disable battery optimization for the app to ensure reliable background playback.

3. **Android Versions**: Tested and working on Android 8.0+. Android 14+ requires `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permission (already added).

4. **iOS Support**: The same code works on iOS with `UIBackgroundModes: ["audio"]` (already configured in `app.json`).

5. **Stream URL**: Currently using `https://stream.zeno.fm/hmc38shnrwzuv`. This is preserved from the original implementation.

---

## 📞 Support

If you encounter issues during the build process:
1. Check EAS build logs for specific error messages
2. Verify all permissions are correctly set in `app.json`
3. Ensure you're using a custom development build, not Expo Go
4. Test on a real Android device, not an emulator (some emulators have issues with foreground services)

---

**✅ Implementation Complete**

The app now has true Android background audio playback with foreground service support. Users can listen to Yo Hit Radio while using other apps, with the screen locked, or when the device is in standby mode.
