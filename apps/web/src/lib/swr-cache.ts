interface SWREntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, SWREntry<any>>();

export class SWRCache {
  private static TTL_DEFAULT_MS = 60 * 1000; // 1 minute fresh TTL

  static get<T>(key: string): T | null {
    // 1. Check memory cache first (<0.1ms)
    const mem = memoryCache.get(key);
    if (mem) return mem.data as T;

    // 2. Check localStorage
    try {
      const raw = localStorage.getItem(`swr:${key}`);
      if (raw) {
        const parsed: SWREntry<T> = JSON.parse(raw);
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  static set<T>(key: string, data: T) {
    const entry: SWREntry<T> = {
      data,
      timestamp: Date.now()
    };
    memoryCache.set(key, entry);
    try {
      localStorage.setItem(`swr:${key}`, JSON.stringify(entry));
    } catch {
      // Ignore quota exceeded
    }
  }

  static invalidate(keyPrefix: string) {
    for (const k of memoryCache.keys()) {
      if (k.startsWith(keyPrefix)) {
        memoryCache.delete(k);
      }
    }
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`swr:${keyPrefix}`)) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Stale-While-Revalidate execution:
   * Returns cached data immediately if available, triggers background fetch to update cache.
   */
  static async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number;
      forceRefresh?: boolean;
      onRevalidated?: (data: T) => void;
    } = {}
  ): Promise<T> {
    const { ttl = this.TTL_DEFAULT_MS, forceRefresh = false, onRevalidated } = options;
    const cachedEntry = memoryCache.get(key);
    const now = Date.now();

    // If fresh and not forcing refresh, return immediately
    if (!forceRefresh && cachedEntry && now - cachedEntry.timestamp < ttl) {
      return cachedEntry.data as T;
    }

    const cachedData = this.get<T>(key);

    // Background fetch promise
    const fetchPromise = (async () => {
      try {
        const fresh = await fetcher();
        this.set(key, fresh);
        if (onRevalidated && cachedData !== null) {
          onRevalidated(fresh);
        }
        return fresh;
      } catch (err) {
        if (cachedData !== null) return cachedData;
        throw err;
      }
    })();

    // If stale data is available and not forcing refresh, return stale data immediately and let fetchPromise run in background
    if (!forceRefresh && cachedData !== null) {
      void fetchPromise;
      return cachedData;
    }

    // Otherwise wait for network
    return fetchPromise;
  }
}
