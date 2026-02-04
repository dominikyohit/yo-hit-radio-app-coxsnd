
/**
 * Zeno Radio Metadata Fetcher
 * 
 * ONLY uses the official Zeno Metadata API - NO ICY metadata
 * ICY metadata does NOT work with Zeno.fm streams
 * 
 * Fetches live "Now Playing" metadata via backend proxy
 * Backend proxies Zeno Radio's official Metadata API to avoid CORS issues
 * 
 * CONFIGURATION:
 * Station Mount: hmc38shnrwzuv
 * Stream URL: https://stream.zeno.fm/hmc38shnrwzuv
 * Zeno Metadata API: https://api.zeno.fm/mounts/metadata/subscribe/hmc38shnrwzuv
 * Backend Proxy: /api/now-playing
 * 
 * POLLING:
 * Metadata is fetched every 10-15 seconds while the stream is playing
 * (Currently set to 12 seconds in the Home screen component)
 */

import Constants from 'expo-constants';

// Get backend URL from app.json config
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';
const NOW_PLAYING_ENDPOINT = `${BACKEND_URL}/api/now-playing`;

export interface ZenoMetadata {
  displayTitle: string;
  displayArtist: string;
  coverImage: string | null;
}

/**
 * Fetch current track metadata from backend proxy
 * Returns displayTitle, displayArtist, and coverImage for the NOW PLAYING card
 */
export const getZenoMetadata = async (): Promise<ZenoMetadata> => {
  console.log('[Zeno Metadata] Fetching metadata from backend proxy:', NOW_PLAYING_ENDPOINT);
  
  try {
    const response = await fetch(NOW_PLAYING_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[Zeno Metadata] Response status:', response.status);

    if (!response.ok) {
      console.error('[Zeno Metadata] Backend proxy returned error:', response.status, response.statusText);
      return getFallbackMetadata();
    }

    const data = await response.json();
    console.log('[Zeno Metadata] Received data from backend:', data);

    // Map backend response to our display format
    const metadata: ZenoMetadata = {
      displayTitle: data.title || 'Live Stream',
      displayArtist: data.artist || 'Yo Hit Radio',
      coverImage: data.cover || null,
    };
    
    console.log('[Zeno Metadata] ✅ Final metadata:', metadata);
    return metadata;
    
  } catch (error) {
    console.error('[Zeno Metadata] Error fetching metadata from backend proxy:', error);
    return getFallbackMetadata();
  }
};

/**
 * Fallback metadata when API fails
 */
function getFallbackMetadata(): ZenoMetadata {
  return {
    displayTitle: 'Live Stream',
    displayArtist: 'Yo Hit Radio',
    coverImage: null,
  };
}
