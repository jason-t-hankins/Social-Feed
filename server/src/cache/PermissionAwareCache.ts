/**
 * Permission-Aware In-Memory Cache
 * 
 * This cache implementation includes user permissions in the cache key to ensure
 * that users with different permission levels don't accidentally receive each other's data.
 * 
 * Key Concepts:
 * - Cache keys include permission context (user role, permissions, etc.)
 * - TTL-based expiration to prevent stale data
 * - Selective invalidation based on data changes
 * - Memory-efficient storage with size limits
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

interface CacheKey {
  query: string;
  variables?: Record<string, any>;
  userId?: string;
  role?: string;
  permissions?: string[];
}

export class PermissionAwareCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: { maxSize?: number; defaultTTL?: number } = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000; // Max number of cache entries
    this.defaultTTL = options.defaultTTL || 60000; // 1 minute default
  }

  /**
   * Generate a cache key from query, variables, and permission context
   */
  private generateKey(cacheKey: CacheKey): string {
    const parts = [
      cacheKey.query,
      JSON.stringify(cacheKey.variables || {}),
      cacheKey.userId || 'anonymous',
      cacheKey.role || 'none',
      JSON.stringify(cacheKey.permissions?.sort() || []),
    ];
    return parts.join('::');
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(cacheKey: CacheKey): T | null {
    const key = this.generateKey(cacheKey);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[Cache] HIT: ${cacheKey.query} for role=${cacheKey.role}`);
    return entry.data;
  }

  /**
   * Store data in cache with permission context
   */
  set<T>(cacheKey: CacheKey, data: T, ttl?: number): void {
    // Enforce max size - simple LRU: delete oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.generateKey(cacheKey);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });

    console.log(`[Cache] SET: ${cacheKey.query} for role=${cacheKey.role}`);
  }

  /**
   * Invalidate cache entries matching a pattern
   * Useful when data changes and you need to clear related cache entries
   */
  invalidate(pattern: { query?: string; userId?: string; role?: string }): number {
    let deletedCount = 0;

    for (const [key, _entry] of this.cache.entries()) {
      const parts = key.split('::');
      const [cachedQuery, _vars, cachedUserId, cachedRole] = parts;

      let shouldDelete = false;

      if (pattern.query && cachedQuery.includes(pattern.query)) {
        shouldDelete = true;
      }
      if (pattern.userId && cachedUserId === pattern.userId) {
        shouldDelete = true;
      }
      if (pattern.role && cachedRole === pattern.role) {
        shouldDelete = true;
      }

      if (shouldDelete) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[Cache] INVALIDATED ${deletedCount} entries matching:`, pattern);
    }

    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log('[Cache] CLEARED all entries');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: ((this.cache.size / this.maxSize) * 100).toFixed(2),
    };
  }
}

// Global cache instance
export const permissionCache = new PermissionAwareCache({
  maxSize: 500,
  defaultTTL: 30000, // 30 seconds for demo purposes
});
