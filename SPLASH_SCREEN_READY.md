
# ✅ Splash Screen Setup - READY TO USE!

## 🎉 Good News!
The backend has finished building and your splash screen generation endpoint is now live!

## 🚀 Quick Start (3 Steps)

### Step 1: Download the Splash Screen
Run this command in your project directory:

```bash
npm run download-splash
```

This will download the splash screen to `assets/splash.png`.

### Step 2: Verify the Image
Open `assets/splash.png` and verify:
- ✅ Size: 2048x2048 pixels
- ✅ Background: Purple (#4B1E78)
- ✅ Logo: Yo Hit Radio logo centered
- ✅ Text: "La radio des hits" in gold below the logo

### Step 3: Rebuild Android APK
```bash
# Clean and rebuild
rm -rf android/
expo prebuild -p android --clean

# Build APK
eas build -p android --profile preview
```

## 📍 Backend Endpoint
Your splash screen is generated at:
```
https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

You can also download it directly by opening this URL in your browser!

## 📋 What's Been Configured

### ✅ app.json Updated
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

### ✅ Download Scripts Created
- `scripts/download-splash.js` - Node.js script
- `scripts/download-splash.ts` - TypeScript version
- `npm run download-splash` - Package.json script

### ✅ Backend Endpoint Live
- POST `/api/generate-splash`
- Returns: 2048x2048 PNG image
- Background: #4B1E78
- Logo: Yo Hit Radio (40% width)
- Text: "La radio des hits" (#F7D21E)

## 🎯 Alternative Download Methods

If `npm run download-splash` doesn't work, try:

### Browser Download
Open this URL and save the image:
```
https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

### curl Command
```bash
curl -o assets/splash.png https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

### wget Command
```bash
wget -O assets/splash.png https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

## 🔍 Verification Checklist

After downloading, verify:
- [ ] File exists at `assets/splash.png`
- [ ] File size is reasonable (should be 100KB - 500KB)
- [ ] Image opens correctly in an image viewer
- [ ] Background is purple (#4B1E78)
- [ ] Logo is visible and centered
- [ ] Text "La radio des hits" is visible in gold

## 🏗️ Build Process

Once the splash screen is downloaded:

1. **Clean existing build**:
   ```bash
   rm -rf android/
   ```

2. **Prebuild with new splash**:
   ```bash
   expo prebuild -p android --clean
   ```

3. **Build APK** (choose one):
   
   **Option A: EAS Build (Recommended)**
   ```bash
   eas build -p android --profile preview
   ```
   
   **Option B: Local Build**
   ```bash
   cd android && ./gradlew assembleRelease
   ```

4. **Install and test**:
   - Install the APK on your device
   - Close the app completely
   - Reopen to see the new splash screen!

## 📚 Documentation

For more details, see:
- `README_SPLASH_SETUP.md` - Complete setup guide
- `SPLASH_SCREEN_INSTRUCTIONS.md` - Detailed instructions
- `scripts/download-splash.js` - Download script

## 🆘 Troubleshooting

### Problem: Download fails
**Solution**: The endpoint is live, so this shouldn't happen. Check your internet connection and try the browser method.

### Problem: Image doesn't show in app
**Solution**: 
1. Make sure file is at `assets/splash.png` (not in a subfolder)
2. Clear cache: `expo start -c`
3. Rebuild: `expo prebuild -p android --clean`

### Problem: Wrong image appears
**Solution**: Delete old splash screens and rebuild from scratch.

## ✨ Summary

Everything is ready! Just run:

```bash
npm run download-splash
expo prebuild -p android --clean
eas build -p android
```

And you'll have your new splash screen! 🎉

---

**Status**: ✅ READY
**Backend**: ✅ LIVE
**Configuration**: ✅ COMPLETE
**Next Step**: Download the splash screen!
