import type { App } from '../index.js';
import type { FastifyRequest } from 'fastify';

interface StreamMetadata {
  artist: string;
  title: string;
}

interface CachedMetadata {
  data: StreamMetadata;
  timestamp: number;
}

const CACHE_DURATION_MS = 5000; // 5 seconds
let cachedMetadata: CachedMetadata | null = null;

function parseStreamTitle(streamTitle: string): StreamMetadata {
  // StreamTitle format is typically "Artist - Title"
  const parts = streamTitle.split(' - ');

  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  }

  // If no separator found, treat the whole thing as title
  return {
    artist: '',
    title: streamTitle.trim(),
  };
}

async function fetchStreamMetadata(): Promise<StreamMetadata> {
  // Check cache
  if (cachedMetadata && Date.now() - cachedMetadata.timestamp < CACHE_DURATION_MS) {
    return cachedMetadata.data;
  }

  try {
    const response = await fetch('https://stream.zeno.fm/hmc38shnrwzuv', {
      method: 'GET',
      headers: {
        'Icy-MetaData': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stream: ${response.statusText}`);
    }

    // Get the Icy-MetaInt header to know metadata block size
    const icyMetaInt = response.headers.get('icy-metaint');
    if (!icyMetaInt) {
      throw new Error('Stream does not support ICY metadata');
    }

    const metadataInterval = parseInt(icyMetaInt, 10);
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Metadata starts at metadataInterval bytes
    // First byte is metadata block size (in 16-byte chunks)
    if (uint8Array.length <= metadataInterval) {
      throw new Error('Metadata not found in response');
    }

    const metadataBlockSize = uint8Array[metadataInterval] * 16;
    if (metadataBlockSize === 0) {
      throw new Error('No metadata available');
    }

    // Extract metadata bytes
    const metadataStart = metadataInterval + 1;
    const metadataEnd = metadataStart + metadataBlockSize;
    const metadataBytes = uint8Array.slice(metadataStart, metadataEnd);

    // Convert bytes to string and parse
    const metadataString = new TextDecoder().decode(metadataBytes).split('\0')[0];

    // Parse StreamTitle from metadata
    // Format: "StreamTitle='Artist - Title';"
    const streamTitleMatch = metadataString.match(/StreamTitle='([^']*)'/);
    const streamTitle = streamTitleMatch ? streamTitleMatch[1] : '';

    if (!streamTitle) {
      throw new Error('No stream title found in metadata');
    }

    const metadata = parseStreamTitle(streamTitle);

    // Cache the result
    cachedMetadata = {
      data: metadata,
      timestamp: Date.now(),
    };

    return metadata;
  } catch (error) {
    // Return cached data if available, even if expired
    if (cachedMetadata) {
      return cachedMetadata.data;
    }
    throw error;
  }
}

export function registerMetadataRoutes(app: App) {
  // GET /api/metadata/live - get current stream metadata with caching
  app.fastify.get(
    '/api/metadata/live',
    {
      schema: {
        description: 'Get current stream metadata from ICY stream with 5-second caching',
        tags: ['metadata'],
        response: {
          200: {
            type: 'object',
            properties: {
              artist: { type: 'string' },
              title: { type: 'string' },
            },
            required: ['artist', 'title'],
          },
        },
      },
    },
    async () => {
      try {
        const metadata = await fetchStreamMetadata();
        return metadata;
      } catch (error) {
        app.logger.error('Error in GET /api/metadata/live');
        throw new Error('Failed to fetch stream metadata');
      }
    }
  );
}
