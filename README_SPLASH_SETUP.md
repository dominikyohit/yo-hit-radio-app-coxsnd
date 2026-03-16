
# 🎨 Yo Hit Radio - Splash Screen Setup Guide

## Overview
This guide will help you set up the custom splash screen for the Yo Hit Radio app with the following specifications:

- **Size**: 2048x2048 pixels
- **Background**: #4B1E78 (purple)
- **Logo**: Yo Hit Radio logo centered at 40% width
- **Text**: "La radio des hits" in gold (#F7D21E)

## ✅ What's Already Done

1. ✅ **app.json Updated**: The configuration has been updated to use the new splash screen:
   ```json
   {
     "splash": {
       "image": "./assets/splash.png",
       "resizeMode": "contain",
       "backgroundColor": "#4B1E78"
     }
   }
   ```

2. ✅ **Backend Endpoint Created**: A backend service is generating the splash screen image at:
   ```
   https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
   ```

3. ✅ **Download Scripts Created**: Two scripts are available to download the splash screen:
   - `scripts/download-splash.js` (Node.js)
   - `scripts/download-splash.ts` (TypeScript)

## 📋 Steps to Complete Setup

### Step 1: Wait for Backend to Finish Building
The backend is currently generating the splash screen endpoint. This usually takes 2-3 minutes.

You can check if it's ready by visiting:
```
https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

If you see an image download, it's ready! If you get a 404 error, wait a bit longer.

### Step 2: Download the Splash Screen

Choose one of the following methods:

#### Method A: Using npm Script (Recommended)
```bash
npm run download-splash
```

#### Method B: Using Node.js Directly
```bash
node scripts/download-splash.js
```

#### Method C: Using curl (Command Line)
```bash
curl -o assets/splash.png https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

#### Method D: Using wget (Command Line)
```bash
wget -O assets/splash.png https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

#### Method E: Using Browser
1. Open this URL in your browser:
   ```
   https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
   ```
2. The image will download automatically
3. Save it as `splash.png` in the `assets/` folder of your project

### Step 3: Verify the Splash Screen

After downloading, verify that:
- ✅ The file exists at `assets/splash.png`
- ✅ The image is 2048x2048 pixels
- ✅ The background is purple (#4B1E78)
- ✅ The Yo Hit Radio logo is centered
- ✅ The text "La radio des hits" appears below the logo in gold

You can open the image in any image viewer or editor to verify.

### Step 4: Clean and Rebuild Android

Now that the splash screen is in place, rebuild your Android app:

```bash
# Clean existing Android build
rm -rf android/

# Prebuild with the new splash screen
expo prebuild -p android --clean

# Build the APK using EAS (recommended)
eas build -p android --profile preview

# OR build locally (if you have Android Studio set up)
cd android && ./gradlew assembleRelease
```

### Step 5: Test the Splash Screen

1. Install the new APK on your Android device
2. Close the app completely
3. Open the app again
4. You should see the new purple splash screen with the logo and text!

## 🔧 Troubleshooting

### Problem: Backend Returns 404
**Solution**: The backend is still building. Wait 2-3 minutes and try again.

### Problem: Image Not Displaying in App
**Solutions**:
1. Make sure the file is exactly at `assets/splash.png` (not in a subfolder)
2. Clear the Expo cache: `expo start -c`
3. Rebuild the native project: `expo prebuild -p android --clean`
4. Make sure `app.json` has the correct path: `"./assets/splash.png"`

### Problem: Wrong Colors or Layout
**Solution**: The backend generates the image programmatically. If the output doesn't match expectations:
1. Download the image and inspect it
2. If needed, you can manually edit it with an image editor
3. Or contact support to adjust the backend generation logic

### Problem: Splash Screen Shows Old Image
**Solutions**:
1. Delete the old splash screen file completely
2. Clear all caches: `expo start -c`
3. Delete the `android/` folder: `rm -rf android/`
4. Rebuild from scratch: `expo prebuild -p android --clean`

### Problem: Download Script Fails
**Solutions**:
1. Check your internet connection
2. Make sure the backend URL is accessible
3. Try downloading manually via browser (Method E above)
4. Check if you have write permissions in the `assets/` folder

## 📱 Current Configuration

### app.json
```json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#4B1E78"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#4B1E78"
      }
    }
  }
}
```

### Splash Screen Specifications
- **File**: `assets/splash.png`
- **Size**: 2048x2048 pixels
- **Format**: PNG
- **Background**: #4B1E78 (purple)
- **Logo**: Yo Hit Radio logo at 40% width
- **Text**: "La radio des hits" in #F7D21E (gold)
- **Resize Mode**: contain
- **Background Color**: #4B1E78

## 🎯 Quick Reference

### Download Command
```bash
npm run download-splash
```

### Rebuild Command
```bash
expo prebuild -p android --clean && eas build -p android
```

### Backend URL
```
https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

## 📞 Need Help?

If you encounter any issues:
1. Check this README for troubleshooting steps
2. Verify the backend is accessible
3. Make sure all file paths are correct
4. Try clearing caches and rebuilding from scratch

---

**Last Updated**: 2024
**App Version**: 1.0.2
**Package**: com.yohitradio.app
