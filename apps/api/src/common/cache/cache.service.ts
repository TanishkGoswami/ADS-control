import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
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
            this.logger.warn(`Redis connection error, falling back to in-memory store: ${err.message}`);
          }
          this.isRedisAvailable = false;
        });

        client.on('connect', () => {
          this.isRedisAvailable = true;
          this.logger.log('⚡ Connected to Redis high-speed cache');
        });

        await client.connect().catch((err) => {
          this.logger.log(`Redis not available (${err.message}). Using ultra-fast In-Memory Cache.`);
        });

        this.redisClient = client;
      } catch (err: any) {
        this.logger.log(`Redis initialization skipped (${err.message}). Running on In-Memory Cache.`);
      }
    } else {
      this.logger.log('Running on Ultra-Fast In-Memory Cache Engine (<1ms response).');
    }

    // Run garbage collection every 60s for memory store
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
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        if (raw) return JSON.parse(raw) as T;
      } catch (err) {
        // Fallback to memory on transient Redis failure
      }
    }

    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const serialized = JSON.stringify(value);

    // Write to in-memory store
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
      } catch (err) {
        // In-memory has already succeeded
      }
    }
  }

  async del(key: string): Promise<void> {
    this.memoryStore.delete(key);
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err) {
        // Ignore
      }
    }
  }

  async delPattern(pattern: string): Promise<void> {
    // Regex match for in-memory store
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of this.memoryStore.keys()) {
      if (regex.test(key)) {
        this.memoryStore.delete(key);
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
   * Cache-Aside Wrapper: Returns cached data or fetches fresh, stores in cache, and returns
   */
  async wrap<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}
