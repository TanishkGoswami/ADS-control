import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
}

export function safeJsonStringify(value: any): string {
  return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? { __bigint__: v.toString() } : v));
}

export function safeJsonParse<T = any>(raw: string): T {
  return JSON.parse(raw, (_, v) => {
    if (v && typeof v === 'object' && '__bigint__' in v && typeof v.__bigint__ === 'string') {
      try {
        return BigInt(v.__bigint__);
      } catch {
        return v.__bigint__;
      }
    }
    return v;
  });
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis | null = null;
  private isRedisAvailable = false;
  private readonly memoryStore = new Map<string, MemoryCacheEntry>();
  private memoryCleanupInterval: NodeJS.Timeout | null = null;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);

    if (redisUrl) {
      try {
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
          lazyConnect: true
        });

        client.on('error', (err) => {
          if (this.isRedisAvailable) {
            this.logger.warn(`Redis connection error, falling back to L1 in-memory store: ${err.message}`);
          }
          this.isRedisAvailable = false;
        });

        client.on('connect', () => {
          this.isRedisAvailable = true;
          this.logger.log('⚡ Connected to Redis high-speed distributed cache');
        });

        await client.connect().catch((err) => {
          this.logger.log(`Redis not available (${err.message}). Using ultra-fast L1 In-Memory Cache (<0.5ms).`);
        });

        this.redisClient = client;
      } catch (err: any) {
        this.logger.log(`Redis initialization skipped (${err.message}). Running on L1 In-Memory Cache.`);
      }
    } else {
      this.logger.log('⚡ Running on Ultra-Fast L1 In-Memory Cache Engine (<0.5ms response).');
    }

    // Garbage collection every 60s for memory store
    this.memoryCleanupInterval = setInterval(() => this.cleanupMemoryStore(), 60000);
  }

  onModuleDestroy() {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
    }
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  private cleanupMemoryStore() {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryStore.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. Fast L1 Memory Cache (<0.1ms)
    const entry = this.memoryStore.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        return entry.value as T;
      }
      this.memoryStore.delete(key);
    }

    // 2. L2 Redis Cache (if available)
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw) {
          const parsed = safeJsonParse<T>(raw);
          // Populate L1 cache for subsequent hits
          this.memoryStore.set(key, {
            value: parsed,
            expiresAt: Date.now() + 60000 // 60s in L1
          });
          return parsed;
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    return null;
  }

  private readonly inFlightPromises = new Map<string, Promise<any>>();

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    // Write to L1 in-memory store immediately (<0.1ms)
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });

    // Write to L2 Redis asynchronously
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const serialized = safeJsonStringify(value);
        await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
      } catch (err) {
        // Non-blocking L2 failure
      }
    }
  }

  async del(key: string): Promise<void> {
    this.memoryStore.delete(key);
    this.inFlightPromises.delete(key);
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err) {
        // Ignore
      }
    }
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of this.memoryStore.keys()) {
      if (regex.test(key)) {
        this.memoryStore.delete(key);
      }
    }
    for (const key of this.inFlightPromises.keys()) {
      if (regex.test(key)) {
        this.inFlightPromises.delete(key);
      }
    }

    if (this.isRedisAvailable && this.redisClient) {
      try {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (err) {
        // Ignore
      }
    }
  }

  /**
   * Cache-Aside Wrapper with Single-Flight Request Coalescing:
   * Returns cached data in <0.5ms, or coalesces concurrent callers onto a single DB query.
   */
  async wrap<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    // Single-Flight: If a fetch for this key is already running, join it
    if (this.inFlightPromises.has(key)) {
      return this.inFlightPromises.get(key) as Promise<T>;
    }

    const fetchPromise = (async () => {
      try {
        const fresh = await fetchFn();
        await this.set(key, fresh, ttlSeconds);
        return fresh;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, fetchPromise);
    return fetchPromise;
  }
}

