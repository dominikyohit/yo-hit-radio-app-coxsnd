
/* eslint-disable no-undef */
/**
 * Script to download the generated splash screen from the backend
 * Run this with: node scripts/download-splash.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const BACKEND_URL = 'https://ggjfh5vjvuut7kh3tnnefceazjf2q6jg.app.specular.dev';
const SPLASH_ENDPOINT = '/api/generate-splash';
const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'splash.png');

async function downloadSplash() {
  console.log('🎨 Generating splash screen from backend...');
  console.log(`📡 Fetching from: ${BACKEND_URL}${SPLASH_ENDPOINT}`);
  
  const url = `${BACKEND_URL}${SPLASH_ENDPOINT}`;
  
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      console.log(`📊 Response status: ${response.statusCode}`);
      
      if (response.statusCode === 404) {
        reject(new Error('Backend endpoint not ready yet. The backend is still building. Please wait a few minutes and try again.'));
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download splash: HTTP ${response.statusCode}`));
        return;
      }

      // Ensure assets directory exists
      const assetsDir = path.join(__dirname, '..', 'assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      const fileStream = fs.createWriteStream(OUTPUT_PATH);
      let downloadedBytes = 0;
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        process.stdout.write(`\r⬇️  Downloaded: ${(downloadedBytes / 1024).toFixed(2)} KB`);
      });
      
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log('\n✅ Splash screen saved to:', OUTPUT_PATH);
        
        // Verify file size
        const stats = fs.statSync(OUTPUT_PATH);
        console.log(`📦 File size: ${(stats.size / 1024).toFixed(2)} KB`);
        
        if (stats.size < 1000) {
          console.warn('⚠️  Warning: File size is very small. The image might not have generated correctly.');
        }
        
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(OUTPUT_PATH, () => {});
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      reject(new Error(`Network error: ${err.message}`));
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout after 30 seconds'));
    });
  });
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     Yo Hit Radio - Splash Screen Downloader           ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');

downloadSplash()
  .then(() => {
    console.log('');
    console.log('🎉 Splash screen generation complete!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Verify assets/splash.png looks correct');
    console.log('   2. Run: expo prebuild -p android --clean');
    console.log('   3. Build your APK with: eas build -p android');
    console.log('');
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Error generating splash screen:', error.message);
    console.error('');
    
    if (error.message.includes('not ready yet')) {
      console.log('💡 The backend is still building. Please:');
      console.log('   1. Wait 2-3 minutes');
      console.log('   2. Run this script again');
      console.log('   3. Or download manually from:');
      console.log(`      ${BACKEND_URL}${SPLASH_ENDPOINT}`);
    } else {
      console.log('💡 Alternative download methods:');
      console.log(`   • Browser: ${BACKEND_URL}${SPLASH_ENDPOINT}`);
      console.log(`   • curl: curl -o assets/splash.png ${BACKEND_URL}${SPLASH_ENDPOINT}`);
      console.log(`   • wget: wget -O assets/splash.png ${BACKEND_URL}${SPLASH_ENDPOINT}`);
    }
    
    console.log('');
    process.exit(1);
  });
