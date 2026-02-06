
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Metadata Cache Manager
 * 
 * Caches "Now Playing" metadata to provide instant display on slow networks.
 * Metadata is stored locally and displayed immediately while fresh data loads in background.
 */

const METADATA_CACHE_KEY = '@yohitradio:metadata_cache';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export interface CachedMetadata {
  displayTitle: string;
  displayArtist: string;
  coverImage: string | null;
  timestamp: number;
}

/**
 * Save metadata to cache
 */
export async function saveMetadataCache(metadata: Omit<CachedMetadata, 'timestamp'>): Promise<void> {
  try {
    const cacheData: CachedMetadata = {
      ...metadata,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(METADATA_CACHE_KEY, JSON.stringify(cacheData));
    console.log('[MetadataCache] Saved metadata to cache:', metadata.displayTitle);
  } catch (error) {
    console.error('[MetadataCache] Error saving metadata cache:', error);
  }
}

/**
 * Load metadata from cache
 * Returns null if cache is expired or doesn't exist
 */
export async function loadMetadataCache(): Promise<CachedMetadata | null> {
  try {
    const cached = await AsyncStorage.getItem(METADATA_CACHE_KEY);
    if (!cached) {
      console.log('[MetadataCache] No cached metadata found');
      return null;
    }

    const cacheData: CachedMetadata = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;

    if (age > CACHE_EXPIRY_MS) {
      console.log('[MetadataCache] Cached metadata expired (age:', Math.round(age / 1000), 'seconds)');
      return null;
    }

    console.log('[MetadataCache] Loaded cached metadata:', cacheData.displayTitle, '(age:', Math.round(age / 1000), 'seconds)');
    return cacheData;
  } catch (error) {
    console.error('[MetadataCache] Error loading metadata cache:', error);
    return null;
  }
}

/**
 * Clear metadata cache
 */
export async function clearMetadataCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(METADATA_CACHE_KEY);
    console.log('[MetadataCache] Cleared metadata cache');
  } catch (error) {
    console.error('[MetadataCache] Error clearing metadata cache:', error);
  }
}
