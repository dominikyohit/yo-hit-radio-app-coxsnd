
/**
 * Network Helpers
 * 
 * Utilities for handling slow/unstable network connections:
 * - Fetch with timeout and retry logic
 * - Exponential backoff for retries
 * - Graceful error handling
 */

export interface FetchWithTimeoutOptions {
  timeout?: number; // Timeout in milliseconds (default: 10000)
  retries?: number; // Number of retry attempts (default: 2)
  retryDelay?: number; // Initial retry delay in milliseconds (default: 1000)
}

/**
 * Fetch with timeout and retry logic
 * 
 * Automatically retries failed requests with exponential backoff.
 * Prevents UI freezing on slow networks.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  config: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const {
    timeout = 10000, // 10 second timeout
    retries = 2,
    retryDelay = 1000,
  } = config;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[NetworkHelpers] Fetching ${url} (attempt ${attempt + 1}/${retries + 1})`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log(`[NetworkHelpers] Successfully fetched ${url}`);
        return response;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a timeout or network error
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const isNetworkError = error instanceof Error && error.message.includes('Network request failed');

      console.warn(
        `[NetworkHelpers] Fetch attempt ${attempt + 1} failed:`,
        isTimeout ? 'Timeout' : isNetworkError ? 'Network error' : error
      );

      // Don't retry on the last attempt
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`[NetworkHelpers] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  console.error(`[NetworkHelpers] All ${retries + 1} attempts failed for ${url}`);
  throw lastError || new Error('Fetch failed after all retries');
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('aborted') ||
    message.includes('fetch') ||
    error.name === 'AbortError'
  );
}
