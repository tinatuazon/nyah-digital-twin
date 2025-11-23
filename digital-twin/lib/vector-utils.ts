/**
 * Utility functions for vector operations with enhanced error handling and optimization
 */

/** Configuration constants for vector operations */
export const VECTOR_CONFIG = {
  CONNECTION_TIMEOUT: 15000, // 15 seconds
  UPLOAD_BATCH_SIZE: 10,
  MAX_RETRIES: 3,
  MIN_CHUNK_LENGTH: 10,
  MAX_CHUNK_LENGTH: 2000,
} as const;

/**
 * Truncates content to fit within maximum length while preserving readability
 * @param content - Content to truncate
 * @returns Truncated content with proper ending
 */
export function truncateContent(content: string): string {
  if (content.length <= VECTOR_CONFIG.MAX_CHUNK_LENGTH) {
    return content;
  }
  
  // Find a good breaking point near the limit
  const truncated = content.substring(0, VECTOR_CONFIG.MAX_CHUNK_LENGTH - 10);
  const lastSentence = truncated.lastIndexOf('. ');
  const lastSpace = truncated.lastIndexOf(' ');
  
  const breakPoint = lastSentence > -1 ? lastSentence + 1 : (lastSpace > -1 ? lastSpace : truncated.length);
  
  return truncated.substring(0, breakPoint) + (breakPoint < content.length ? '...' : '');
}

/**
 * Validates if the provided URL is a valid Upstash Vector database URL
 * @param url - URL to validate
 * @returns True if valid vector URL format
 */
export function isValidVectorUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('vector.upstash.io') && urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Creates a delay for retry operations with exponential backoff
 * @param attempt - Current attempt number (1-based)
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Promise that resolves after the calculated delay
 */
export function createRetryDelay(attempt: number, maxDelay: number = 5000): Promise<void> {
  const delay = Math.min(1000 * Math.pow(2, attempt - 1), maxDelay);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Enhanced logger specifically for vector operations
 */
export class VectorLogger {
  static info(message: string, data?: unknown): void {
    console.log(`INFO [VECTOR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
  
  static warn(message: string, data?: unknown): void {
    console.warn(`WARN [VECTOR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
  
  static error(message: string, error?: unknown): void {
    console.error(`ERROR [VECTOR] ${message}`, error);
  }
  
  static debug(message: string, data?: unknown): void {
    console.log(`DEBUG [VECTOR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
  
  static performance(operation: string, duration: number, metadata?: unknown): void {
    console.log(`PERF [VECTOR] ${operation}: ${duration.toFixed(2)}ms`, metadata ? JSON.stringify(metadata, null, 2) : '');
  }
}