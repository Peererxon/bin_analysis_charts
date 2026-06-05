import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { eq, banks, appConfig, alertRules } from '@bin-analysis/db';
import type { Bank, AlertRule, Database } from '@bin-analysis/db';
import { REDIS_TOKEN } from '../redis/redis.constants.js';
import { DATABASE_TOKEN } from '../database/database.module.js';

export interface FilterConfig {
  minCapitalUsd: number;
  minMaxOfferPct: number;
}

const CACHE_TTL = 300; // 5 minutes
const CACHE_KEYS = {
  activeBanks: 'bin:config:active_banks',
  filterConfig: 'bin:config:filter',
  alertRules: 'bin:config:alert_rules',
} as const;

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(
    @Inject(REDIS_TOKEN) private readonly redis: Redis,
    @Inject(DATABASE_TOKEN) private readonly db: Database,
  ) {}

  /**
   * Get all active banks. Checks Redis cache first, falls back to PostgreSQL.
   */
  async getActiveBanks(): Promise<Bank[]> {
    try {
      const cached = await this.redis.get<string>(CACHE_KEYS.activeBanks);
      if (cached) {
        const parsed =
          typeof cached === 'string' ? JSON.parse(cached) : cached;
        return parsed as Bank[];
      }
    } catch (err) {
      this.logger.warn('Redis cache miss for active banks', err);
    }

    const result = await this.db
      .select()
      .from(banks)
      .where(eq(banks.isActive, true));

    try {
      await this.redis.set(CACHE_KEYS.activeBanks, JSON.stringify(result), {
        ex: CACHE_TTL,
      });
    } catch (err) {
      this.logger.warn('Failed to cache active banks', err);
    }

    return result;
  }

  /**
   * Get filter configuration (Criterio 0 parameters).
   */
  async getFilterConfig(): Promise<FilterConfig> {
    try {
      const cached = await this.redis.get<string>(CACHE_KEYS.filterConfig);
      if (cached) {
        const parsed =
          typeof cached === 'string' ? JSON.parse(cached) : cached;
        return parsed as FilterConfig;
      }
    } catch (err) {
      this.logger.warn('Redis cache miss for filter config', err);
    }

    const rows = await this.db.select().from(appConfig);
    const configMap = new Map(rows.map((r) => [r.key, r.value]));

    const filterConfig: FilterConfig = {
      minCapitalUsd: Number(configMap.get('min_capital_usd') ?? 1000),
      minMaxOfferPct: Number(configMap.get('min_max_offer_pct') ?? 10),
    };

    try {
      await this.redis.set(
        CACHE_KEYS.filterConfig,
        JSON.stringify(filterConfig),
        { ex: CACHE_TTL },
      );
    } catch (err) {
      this.logger.warn('Failed to cache filter config', err);
    }

    return filterConfig;
  }

  /**
   * Get active alert rules for Telegram notifications.
   */
  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const cached = await this.redis.get<string>(CACHE_KEYS.alertRules);
      if (cached) {
        const parsed =
          typeof cached === 'string' ? JSON.parse(cached) : cached;
        return parsed as AlertRule[];
      }
    } catch (err) {
      this.logger.warn('Redis cache miss for alert rules', err);
    }

    const result = await this.db
      .select()
      .from(alertRules)
      .where(eq(alertRules.isActive, true));

    try {
      await this.redis.set(CACHE_KEYS.alertRules, JSON.stringify(result), {
        ex: CACHE_TTL,
      });
    } catch (err) {
      this.logger.warn('Failed to cache alert rules', err);
    }

    return result;
  }

  /**
   * Invalidate all cached config so next read refreshes from PostgreSQL.
   */
  async invalidateCache(): Promise<void> {
    await Promise.all(
      Object.values(CACHE_KEYS).map((key) => this.redis.del(key)),
    );
    this.logger.log('Config cache invalidated');
  }
}
