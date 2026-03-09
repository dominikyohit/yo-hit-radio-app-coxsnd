
# 🎵 Yo Hit Radio - Audio Setup & Build Instructions

## ⚠️ CRITICAL INFORMATION

This app uses `react-native-track-player` for background audio playback. This is a **native module** that:

- ❌ **DOES NOT WORK** in standard Expo Go app
- ❌ **DOES NOT WORK** in web preview
- ✅ **REQUIRES** a custom development build or production APK/AAB

## 🔍 Why is the Preview Blank?

The preview is blank because `react-native-track-player` is a native module that is not available in Expo Go. The app has conditional checks to prevent crashes, but the audio functionality will not work in the preview environment.

**This is EXPECTED behavior.**

## 🏗️ How to Build and Test the App

### Option 1: Build a Development APK (Recommended for Testing)

This creates an APK you can install on your Android device for testing.

**Steps:**

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS**:
   ```bash
   eas login
   ```

3. **Build Development APK**:
   ```bash
   eas build --platform android --profile development
   ```

4. **Wait for Build**: The command will provide a link to the EAS Build dashboard. Monitor the build progress there.

5. **Download and Install**: Once complete, download the APK from the dashboard and install it on your Android device.

6. **Test Background Audio**: Open the app, play the radio stream, then:
   - Press the home button (app goes to background)
   - Lock your device
   - Pull down the notification shade
   - You should see media controls and audio should continue playing

### Option 2: Build a Preview APK (For Sharing)

This creates an APK for internal testing/sharing.

```bash
eas build --platform android --profile preview
```

### Option 3: Build a Production AAB (For Google Play Store)

This creates an Android App Bundle for uploading to Google Play Console.

```bash
eas build --platform android --profile production
```

## 📱 Testing Background Audio

Once you have the APK installed:

1. **Open the app**
2. **Tap the Play button** on the home screen
3. **Verify audio starts playing**
4. **Test background playback**:
   - Press the home button → Audio should continue
   - Lock the device → Audio should continue
   - Pull down notification shade → You should see media controls
   - Tap pause in notification → Audio should pause
   - Tap play in notification → Audio should resume

## 🐛 Troubleshooting

### Build Fails with Kotlin Compilation Error

**Error:**
```
Execution failed for task ':react-native-track-player:compileDebugKotlin'
```

**Solution:** This is a known issue with `react-native-track-player` 4.1.1 and Expo SDK 54. The fix has been applied in the configuration files. If the error persists:

1. Clear EAS build cache:
   ```bash
   eas build --platform android --profile development --clear-cache
   ```

2. If still failing, try downgrading to version 4.0.1:
   - Edit `package.json`: `"react-native-track-player": "4.0.1"`
   - Run: `npm install`
   - Rebuild: `eas build --platform android --profile development`

### Preview is Blank

**This is expected.** `react-native-track-player` does not work in Expo Go. You must build a custom development client or APK to test the app.

### Audio Doesn't Play in Background

Make sure you're testing on a **built APK**, not in Expo Go. Background audio will never work in Expo Go.

## 📋 Build Configuration Summary

### app.json Changes:
- ✅ Added `react-native-track-player` plugin configuration
- ✅ Disabled `newArchEnabled` (set to `false` for compatibility)
- ✅ Android permissions configured for foreground service and media playback

### eas.json Changes:
- ✅ Development profile configured to build APK
- ✅ Preview profile configured for internal distribution
- ✅ Production profile configured to build AAB

## 🎯 Next Steps

1. **Build the development APK** using the command above
2. **Install it on your Android device**
3. **Test the background audio functionality**
4. **Once verified, build production AAB** for Google Play Store

## 📞 Support

If you encounter issues during the build process, check:
- EAS Build dashboard for detailed error logs
- Expo documentation: https://docs.expo.dev/build/introduction/
- react-native-track-player docs: https://react-native-track-player.js.org/

---

**Remember:** The app will NOT work in Expo Go preview. You MUST build an APK/AAB to test and use the app.
