
/**
 * Metadata Service for fetching live radio metadata
 * Polls the backend ICY metadata proxy
 */

import { BACKEND_URL } from './api';

const METADATA_ENDPOINT = `${BACKEND_URL}/api/metadata/live`;

export interface LiveMetadata {
  artist: string;
  title: string;
  raw: string;
}

/**
 * Fetch current live stream metadata from backend proxy
 */
export async function fetchLiveMetadata(): Promise<LiveMetadata> {
  try {
    const response = await fetch(METADATA_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      artist: data.artist || '',
      title: data.title || '',
      raw: data.raw || '',
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return { artist: '', title: '', raw: '' };
  }
}
