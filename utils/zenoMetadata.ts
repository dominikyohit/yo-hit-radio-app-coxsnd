
/**
 * Zeno Radio Metadata Fetcher
 * 
 * Fetches live "Now Playing" metadata from Zeno Radio's official Metadata API
 * 
 * CONFIGURATION:
 * Station Mount: hmc38shnrwzuv
 * Stream URL: https://stream.zeno.fm/hmc38shnrwzuv
 * Metadata API: https://api.zeno.fm/mounts/metadata/subscribe/hmc38shnrwzuv
 */

// Station mount ID
const ZENO_MOUNT_ID = 'hmc38shnrwzuv';

export interface ZenoMetadata {
  displayTitle: string;
  displayArtist: string;
  coverImage: string | null;
}

/**
 * Fetch current track metadata from Zeno Radio's official Metadata API
 * Returns displayTitle, displayArtist, and coverImage for the NOW PLAYING card
 */
export const getZenoMetadata = async (): Promise<ZenoMetadata> => {
  console.log('[Zeno Metadata] Fetching metadata for mount:', ZENO_MOUNT_ID);
  
  const url = `https://api.zeno.fm/mounts/metadata/subscribe/${ZENO_MOUNT_ID}`;
  
  try {
    console.log('[Zeno Metadata] Calling API:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/event-stream',
      },
    });

    console.log('[Zeno Metadata] Response status:', response.status);

    if (!response.ok) {
      console.error('[Zeno Metadata] API returned error:', response.status, response.statusText);
      return getFallbackMetadata();
    }

    const text = await response.text();
    console.log('[Zeno Metadata] Raw response (first 500 chars):', text.substring(0, 500));

    // Parse the response - could be JSON or event-stream format
    let rawData: any;
    
    if (text.startsWith('data:')) {
      // Event-stream format: extract the last "data:" line
      const dataLines = text.split('\n').filter(line => line.startsWith('data:'));
      if (dataLines.length > 0) {
        const lastDataLine = dataLines[dataLines.length - 1];
        const jsonString = lastDataLine.substring(5).trim(); // Remove "data: " prefix
        console.log('[Zeno Metadata] Extracted JSON from event-stream:', jsonString);
        rawData = JSON.parse(jsonString);
      } else {
        console.log('[Zeno Metadata] No data lines found in event-stream');
        return getFallbackMetadata();
      }
    } else {
      // Direct JSON response
      rawData = JSON.parse(text);
    }

    console.log('[Zeno Metadata] Parsed raw data:', JSON.stringify(rawData, null, 2));

    // Parse the response and map to our display format
    const metadata = parseZenoMetadata(rawData);
    
    console.log('[Zeno Metadata] ✅ Final metadata:', metadata);
    return metadata;
    
  } catch (error) {
    console.error('[Zeno Metadata] Error fetching metadata:', error);
    return getFallbackMetadata();
  }
};

/**
 * Parse Zeno's metadata API response
 * Maps API fields to displayTitle, displayArtist, and coverImage
 */
function parseZenoMetadata(data: any): ZenoMetadata {
  console.log('[Zeno Metadata] Parsing metadata...');

  if (!data) {
    console.log('[Zeno Metadata] Data is null/undefined');
    return getFallbackMetadata();
  }

  // Extract fields from Zeno API response
  // The response may have nested "data" object or direct fields
  const metadataObj = data.data || data;

  let title = '';
  let artist = '';
  let artwork: string | null = null;

  // Try to find title (common field names)
  title = metadataObj.title || metadataObj.song || metadataObj.track || metadataObj.name || '';
  
  // Try to find artist
  artist = metadataObj.artist || metadataObj.performer || '';
  
  // Try to find artwork/cover image
  const artworkField = metadataObj.artwork || metadataObj.cover || metadataObj.image || 
                       metadataObj.album_art || metadataObj.albumArt || metadataObj.cover_url || 
                       metadataObj.coverUrl || '';
  
  // Validate artwork is a valid URL
  if (artworkField && typeof artworkField === 'string' && artworkField.startsWith('http')) {
    artwork = artworkField;
  }

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
    displayTitle: title && title.trim() !== '' ? title : 'Live Stream',
    displayArtist: artist && artist.trim() !== '' ? artist : 'Yo Hit Radio',
    coverImage: artwork,
  };
}

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
