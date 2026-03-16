
# Splash Screen Generation Instructions

## Overview
The backend is currently building an endpoint to generate your custom splash screen with:
- **Background**: #4B1E78 (purple)
- **Logo**: Centered at 40% width
- **Text**: "La radio des hits" in gold (#F7D21E)
- **Size**: 2048x2048 PNG

## Steps to Generate and Use the Splash Screen

### 1. Wait for Backend Build
The backend is currently building the `/api/generate-splash` endpoint. This usually takes 2-3 minutes.

### 2. Download the Splash Screen
Once the backend is ready, run the download script:

```bash
node scripts/download-splash.js
```

This will:
- Download the generated splash screen from the backend
- Save it to `assets/splash.png`
- Verify the file size

### 3. Alternative Download Methods
If the script doesn't work, you can download manually:

**Browser:**
```
https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

**curl:**
```bash
curl -o assets/splash.png https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

**wget:**
```bash
wget -O assets/splash.png https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev/api/generate-splash
```

### 4. Verify the Splash Screen
After downloading, check that:
- File exists at `assets/splash.png`
- File size is reasonable (should be 100KB - 500KB)
- Image looks correct when opened

### 5. Rebuild Android APK
Once the splash screen is in place:

```bash
# Clean prebuild
expo prebuild -p android --clean

# Build APK with EAS
eas build -p android
```

## Configuration
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

## Troubleshooting

### Backend Not Ready
If you get a 404 error, the backend is still building. Wait 2-3 minutes and try again.

### File Size Too Small
If the downloaded file is less than 1KB, something went wrong. Try downloading again or check the backend logs.

### Image Doesn't Look Right
If the splash screen doesn't match the specifications, the backend generation may need adjustment. Contact support with details about what's wrong.

## What Was Fixed
All linting errors have been resolved:
- ✅ Fixed `Array<T>` to `T[]` syntax in index.tsx and shows.tsx
- ✅ Added missing `useEffect` dependencies in index.tsx
- ✅ Fixed `useEffect` dependencies in event-details.tsx
- ✅ Fixed import order in errorLogger.ts
- ✅ Removed `__dirname` usage in download-splash.js (Node.js built-in, not a lint error)

The app is now ready for the splash screen to be generated and integrated!
