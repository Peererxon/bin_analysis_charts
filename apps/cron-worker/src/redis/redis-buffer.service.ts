import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { REDIS_TOKEN } from './redis.constants.js';

/** Shape of a single buffered snapshot before flushing to PostgreSQL */
export interface BufferedSnapshot {
  bankId: number;
  capturedAt: string; // ISO string
  offers: {
    rank: number;
    price: number;
    merchantName: string;
    availableAmount: number;
    maxSingleTrans: number;
    minSingleTrans: number;
  }[];
}

const BUFFER_KEY = 'bin:snapshots:buffer';
const LATEST_KEY_PREFIX = 'bin:snapshots:latest:';
const BUFFER_TTL_SECONDS = 720; // 12 minutes

@Injectable()
export class RedisBufferService {
  private readonly logger = new Logger(RedisBufferService.name);

  constructor(@Inject(REDIS_TOKEN) private readonly redis: Redis) {}

  /**
   * Push a snapshot to the Redis buffer list and update the "latest" key for
   * the given bank with a 12-minute TTL.
   */
  async push(snapshot: BufferedSnapshot): Promise<void> {
    const payload = JSON.stringify(snapshot);
    await this.redis.rpush(BUFFER_KEY, payload);

    // Store the latest snapshot per bank with TTL
    const latestKey = `${LATEST_KEY_PREFIX}${snapshot.bankId}`;
    await this.redis.set(latestKey, payload, { ex: BUFFER_TTL_SECONDS });

    this.logger.debug(
      `Buffered snapshot for bank ${snapshot.bankId} at ${snapshot.capturedAt}`,
    );
  }

  /**
   * Retrieve all pending snapshots from the buffer.
   */
  async getPending(): Promise<BufferedSnapshot[]> {
    const raw = await this.redis.lrange(BUFFER_KEY, 0, -1);
    if (!raw || raw.length === 0) return [];

    return raw.map((item) => {
      if (typeof item === 'string') {
        return JSON.parse(item) as BufferedSnapshot;
      }
      // @upstash/redis may auto-parse JSON
      return item as unknown as BufferedSnapshot;
    });
  }

  /**
   * Clear the entire buffer after a successful flush.
   */
  async clear(): Promise<void> {
    await this.redis.del(BUFFER_KEY);
    this.logger.debug('Buffer cleared');
  }

  /**
   * Get the latest buffered snapshot for a specific bank.
   */
  async getLatest(bankId: number): Promise<BufferedSnapshot | null> {
    const latestKey = `${LATEST_KEY_PREFIX}${bankId}`;
    const raw = await this.redis.get<string>(latestKey);
    if (!raw) return null;

    if (typeof raw === 'string') {
      return JSON.parse(raw) as BufferedSnapshot;
    }
    return raw as unknown as BufferedSnapshot;
  }

  /**
   * Get the current buffer size (number of pending snapshots).
   */
  async getBufferSize(): Promise<number> {
    return await this.redis.llen(BUFFER_KEY);
  }
}
