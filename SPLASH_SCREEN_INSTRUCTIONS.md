
# Splash Screen Generation Instructions

## Overview
The backend is generating a custom splash screen with the following specifications:
- Size: 2048x2048 pixels
- Background: #4B1E78 (purple)
- Logo: Yo Hit Radio logo centered at 40% width
- Text: "La radio des hits" in gold (#F7D21E) below the logo

## Steps to Download and Use the Splash Screen

### 1. Wait for Backend to Finish Building
The backend is currently generating the splash screen endpoint. Check the status with:
```bash
# The backend will be ready when the build completes
```

### 2. Download the Splash Screen
Once the backend is ready, download the splash screen using one of these methods:

#### Option A: Using curl (Command Line)
```bash
curl -o assets/splash.png https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

#### Option B: Using wget (Command Line)
```bash
wget -O assets/splash.png https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

#### Option C: Using Browser
1. Open this URL in your browser:
   ```
   https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
   ```
2. The image will download automatically
3. Save it as `splash.png` in the `assets/` folder

#### Option D: Using Node.js Script
Run the provided download script:
```bash
npx ts-node scripts/download-splash.ts
```

### 3. Verify the Splash Screen
After downloading, verify that:
- The file exists at `assets/splash.png`
- The image is 2048x2048 pixels
- The background is purple (#4B1E78)
- The logo is centered
- The text "La radio des hits" appears below the logo in gold

### 4. Update app.json (Already Done)
The `app.json` has been updated with:
```json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#4B1E78"
    }
  }
}
```

### 5. Rebuild the Android APK
After the splash screen is in place, rebuild your Android app:

```bash
# Clean and prebuild
rm -rf android/
expo prebuild -p android

# Build the APK using EAS
eas build -p android --profile preview

# Or build locally
cd android && ./gradlew assembleRelease
```

## Troubleshooting

### Backend Not Ready
If you get a 404 error, the backend is still building. Wait a few minutes and try again.

### Image Not Displaying
1. Make sure the file is exactly at `assets/splash.png`
2. Clear the Expo cache: `expo start -c`
3. Rebuild the native project: `expo prebuild -p android --clean`

### Wrong Colors or Layout
The backend generates the image programmatically. If the output doesn't match expectations, you may need to manually edit the image or adjust the backend generation logic.

## Current Configuration
- **Splash Image**: `./assets/splash.png`
- **Resize Mode**: `contain`
- **Background Color**: `#4B1E78`
- **Android Adaptive Icon Background**: `#4B1E78`
