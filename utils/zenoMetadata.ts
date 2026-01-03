
/**
 * Zeno Radio Metadata Fetcher
 * 
 * Fetches live "Now Playing" metadata from Zeno Radio stream
 * 
 * CONFIGURATION:
 * Update ZENO_STATION_ID below with your actual Zeno station ID
 * Find it in your Zeno dashboard or stream URL
 * 
 * For stream URL: https://stream.zeno.fm/hmc38shnrwzuv
 * The station ID is: hmc38shnrwzuv
 */

// Station ID from stream URL: https://stream.zeno.fm/hmc38shnrwzuv
const ZENO_STATION_ID = 'hmc38shnrwzuv';

export interface ZenoMetadata {
  title: string;
  artist: string;
  artworkUrl?: string;
}

/**
 * Fetch current track metadata from Zeno Radio
 * Tries multiple API endpoints and formats
 * Includes comprehensive logging for debugging
 */
export const getZenoMetadata = async (): Promise<ZenoMetadata> => {
  console.log('[Zeno Metadata] ========================================');
  console.log('[Zeno Metadata] Starting metadata fetch for station:', ZENO_STATION_ID);
  
  // Try multiple Zeno API endpoints
  const endpoints = [
    // Primary endpoint - Zeno's public metadata API
    `https://api.zeno.fm/mounts/metadata/subscribe/${ZENO_STATION_ID}`,
    // Alternative endpoint - direct station info
    `https://zeno.fm/api/stations/${ZENO_STATION_ID}`,
    // Another alternative - player API
    `https://zeno.fm/api/player/${ZENO_STATION_ID}`,
  ];

  for (const url of endpoints) {
    try {
      console.log('[Zeno Metadata] Trying endpoint:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'YoHitRadio/1.0',
        },
      });

      console.log('[Zeno Metadata] Response status:', response.status);
      console.log('[Zeno Metadata] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      if (!response.ok) {
        console.warn('[Zeno Metadata] Endpoint returned error:', response.status, response.statusText);
        continue; // Try next endpoint
      }

      const contentType = response.headers.get('content-type');
      console.log('[Zeno Metadata] Content-Type:', contentType);

      let rawData;
      if (contentType?.includes('application/json')) {
        rawData = await response.json();
      } else {
        const text = await response.text();
        console.log('[Zeno Metadata] Raw text response:', text);
        try {
          rawData = JSON.parse(text);
        } catch (e) {
          console.warn('[Zeno Metadata] Could not parse response as JSON');
          continue;
        }
      }

      console.log('[Zeno Metadata] Raw response data:', JSON.stringify(rawData, null, 2));

      // Parse metadata from various possible response structures
      const metadata = parseZenoResponse(rawData);
      
      if (metadata.title !== 'Yo Hit Radio' || metadata.artist !== 'Live Stream') {
        console.log('[Zeno Metadata] ✅ Successfully parsed metadata:', metadata);
        return metadata;
      } else {
        console.log('[Zeno Metadata] ⚠️ No valid metadata found in response, trying next endpoint');
      }
    } catch (error) {
      console.error('[Zeno Metadata] Error fetching from endpoint:', url, error);
      continue; // Try next endpoint
    }
  }

  // If all endpoints fail, return fallback
  console.log('[Zeno Metadata] ❌ All endpoints failed, using fallback values');
  console.log('[Zeno Metadata] ========================================');
  return {
    title: 'Yo Hit Radio',
    artist: 'Live Stream',
    artworkUrl: undefined,
  };
};

/**
 * Parse Zeno API response and extract metadata
 * Handles multiple possible response formats
 */
function parseZenoResponse(data: any): ZenoMetadata {
  console.log('[Zeno Metadata] Parsing response structure...');

  // Handle null/undefined
  if (!data) {
    console.log('[Zeno Metadata] Data is null/undefined');
    return { title: 'Yo Hit Radio', artist: 'Live Stream' };
  }

  // Try to extract metadata from various possible structures
  let title = '';
  let artist = '';
  let artworkUrl: string | undefined = undefined;

  // Common field names for title
  const titleFields = [
    'streamTitle',
    'title',
    'song',
    'track',
    'name',
    'current_track',
    'nowplaying',
    'now_playing',
  ];

  // Common field names for artist
  const artistFields = [
    'artist',
    'streamArtist',
    'performer',
    'creator',
  ];

  // Common field names for artwork
  const artworkFields = [
    'artworkUrl',
    'artwork_url',
    'image',
    'cover',
    'coverUrl',
    'cover_url',
    'albumArt',
    'album_art',
    'thumbnail',
  ];

  // Check if data has nested structure (e.g., data.data, data.result, data.metadata)
  const possibleDataLocations = [
    data,
    data.data,
    data.result,
    data.metadata,
    data.nowplaying,
    data.now_playing,
    data.current,
    data.current_track,
  ];

  for (const location of possibleDataLocations) {
    if (!location || typeof location !== 'object') continue;

    // Try to find title
    if (!title) {
      for (const field of titleFields) {
        if (location[field] && typeof location[field] === 'string') {
          title = location[field].trim();
          console.log(`[Zeno Metadata] Found title in field '${field}':`, title);
          break;
        }
      }
    }

    // Try to find artist
    if (!artist) {
      for (const field of artistFields) {
        if (location[field] && typeof location[field] === 'string') {
          artist = location[field].trim();
          console.log(`[Zeno Metadata] Found artist in field '${field}':`, artist);
          break;
        }
      }
    }

    // Try to find artwork
    if (!artworkUrl) {
      for (const field of artworkFields) {
        if (location[field] && typeof location[field] === 'string') {
          artworkUrl = location[field].trim();
          console.log(`[Zeno Metadata] Found artwork in field '${field}':`, artworkUrl);
          break;
        }
      }
    }

    // If we found all fields, we can stop
    if (title && artist && artworkUrl) break;
  }

  // Handle combined "Artist - Title" format
  if (title && !artist && title.includes(' - ')) {
    const parts = title.split(' - ');
    if (parts.length === 2) {
      artist = parts[0].trim();
      title = parts[1].trim();
      console.log('[Zeno Metadata] Split combined format:', { artist, title });
    }
  }

  // Handle combined "Title by Artist" format
  if (title && !artist && title.toLowerCase().includes(' by ')) {
    const parts = title.toLowerCase().split(' by ');
    if (parts.length === 2) {
      const originalParts = title.split(/ by /i);
      title = originalParts[0].trim();
      artist = originalParts[1].trim();
      console.log('[Zeno Metadata] Split "by" format:', { artist, title });
    }
  }

  console.log('[Zeno Metadata] Final parsed values:', {
    title: title || 'Yo Hit Radio',
    artist: artist || 'Live Stream',
    artworkUrl: artworkUrl || 'none',
  });

  return {
    title: title || 'Yo Hit Radio',
    artist: artist || 'Live Stream',
    artworkUrl,
  };
}
