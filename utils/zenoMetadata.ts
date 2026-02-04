
/**
 * Zeno Radio Metadata Fetcher
 * 
 * Fetches live "Now Playing" metadata from Zeno Radio's official API
 * 
 * CONFIGURATION:
 * Station ID: hmc38shnrwzuv
 * Stream URL: https://stream.zeno.fm/hmc38shnrwzuv
 * Metadata API: https://zenoplay.zeno.fm/api/nowplaying/hmc38shnrwzuv
 */

// Station ID from stream URL
const ZENO_STATION_ID = 'hmc38shnrwzuv';

export interface ZenoMetadata {
  displayTitle: string;
  displayArtist: string;
  coverImage: string;
}

/**
 * Fetch current track metadata from Zeno Radio's official now playing API
 * Returns displayTitle, displayArtist, and coverImage for the NOW PLAYING card
 */
export const getZenoMetadata = async (): Promise<ZenoMetadata> => {
  console.log('[Zeno Metadata] Fetching now playing info for station:', ZENO_STATION_ID);
  
  const url = `https://zenoplay.zeno.fm/api/nowplaying/${ZENO_STATION_ID}`;
  
  try {
    console.log('[Zeno Metadata] Calling API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[Zeno Metadata] Response status:', response.status);

    if (!response.ok) {
      console.error('[Zeno Metadata] API returned error:', response.status, response.statusText);
      return getFallbackMetadata();
    }

    const data = await response.json();
    console.log('[Zeno Metadata] Raw API response:', JSON.stringify(data, null, 2));

    // Parse the response and map to our display format
    const metadata = parseZenoNowPlaying(data);
    
    console.log('[Zeno Metadata] ✅ Parsed metadata:', metadata);
    return metadata;
    
  } catch (error) {
    console.error('[Zeno Metadata] Error fetching metadata:', error);
    return getFallbackMetadata();
  }
};

/**
 * Parse Zeno's now playing API response
 * Maps API fields to displayTitle, displayArtist, and coverImage
 */
function parseZenoNowPlaying(data: any): ZenoMetadata {
  console.log('[Zeno Metadata] Parsing now playing data...');

  if (!data) {
    console.log('[Zeno Metadata] Data is null/undefined');
    return getFallbackMetadata();
  }

  // Extract fields from Zeno API response
  // Common field names: title, artist, artwork, cover, image, album_art
  let title = '';
  let artist = '';
  let artwork = '';

  // Try to find title
  title = data.title || data.song || data.track || data.name || '';
  
  // Try to find artist
  artist = data.artist || data.performer || '';
  
  // Try to find artwork/cover image
  artwork = data.artwork || data.cover || data.image || data.album_art || data.albumArt || '';

  console.log('[Zeno Metadata] Extracted fields:', { title, artist, artwork });

  // Handle combined "Artist - Title" format if no separate artist field
  if (title && !artist && title.includes(' - ')) {
    const parts = title.split(' - ');
    if (parts.length === 2) {
      artist = parts[0].trim();
      title = parts[1].trim();
      console.log('[Zeno Metadata] Split combined format:', { artist, title });
    }
  }

  // Return mapped metadata with fallbacks
  return {
    displayTitle: title || 'Live Stream',
    displayArtist: artist || 'Yo Hit Radio',
    coverImage: artwork || '',
  };
}

/**
 * Fallback metadata when API fails
 */
function getFallbackMetadata(): ZenoMetadata {
  return {
    displayTitle: 'Live Stream',
    displayArtist: 'Yo Hit Radio',
    coverImage: '',
  };
}
