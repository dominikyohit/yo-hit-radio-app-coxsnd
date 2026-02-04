
/**
 * Metadata Service for fetching live radio metadata
 * Polls the backend ICY metadata proxy
 */

import { BACKEND_URL } from './api';

const METADATA_ENDPOINT = `${BACKEND_URL}/api/metadata/live`;

export interface LiveMetadata {
  artist: string;
  title: string;
  artwork?: string;
  raw: string;
}

/**
 * Fetch current live stream metadata from backend proxy
 */
export async function fetchLiveMetadata(): Promise<LiveMetadata> {
  try {
    console.log('[MetadataService] Fetching from:', METADATA_ENDPOINT);
    
    const response = await fetch(METADATA_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[MetadataService] HTTP error:', response.status);
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[MetadataService] Received data:', data);
    
    // Parse the metadata fields
    const result: LiveMetadata = {
      artist: data.artist || '',
      title: data.title || '',
      artwork: data.artwork || data.cover_url || data.coverUrl || undefined,
      raw: data.raw || JSON.stringify(data),
    };
    
    console.log('[MetadataService] Parsed result:', result);
    
    return result;
  } catch (error) {
    console.error('[MetadataService] Error fetching metadata:', error);
    return { 
      artist: '', 
      title: '', 
      raw: `Error: ${error}` 
    };
  }
}
