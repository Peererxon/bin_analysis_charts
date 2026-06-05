import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { snapshots, offers } from '@bin-analysis/db';
import type { Database } from '@bin-analysis/db';
import { DATABASE_TOKEN } from '../database/database.module.js';
import { BinanceP2PService } from '../binance/binance-p2p.service.js';
import { RedisBufferService } from '../redis/redis-buffer.service.js';
import type { BufferedSnapshot } from '../redis/redis-buffer.service.js';
import { AppConfigService } from '../config/config.service.js';
import { TelegramService } from '../telegram/telegram.service.js';

@Injectable()
export class MarketIngestionService {
  private readonly logger = new Logger(MarketIngestionService.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly binanceService: BinanceP2PService,
    private readonly redisBuffer: RedisBufferService,
    private readonly configService: AppConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * EVERY 10 MINUTES: Collect snapshots from Binance P2P for each active bank
   * and buffer them in Redis.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async collectSnapshots(): Promise<void> {
    this.logger.log('⏰ Starting snapshot collection...');

    try {
      const [activeBanks, filterConfig] = await Promise.all([
        this.configService.getActiveBanks(),
        this.configService.getFilterConfig(),
      ]);

      if (activeBanks.length === 0) {
        this.logger.warn('No active banks configured, skipping collection');
        return;
      }

      let totalOffers = 0;
      const errors: string[] = [];

      // Fetch ads for each active bank sequentially to avoid rate limiting
      for (const bank of activeBanks) {
        if (!bank.binancePayType) {
          this.logger.warn(`Bank ${bank.name} has no binancePayType, skipping`);
          continue;
        }

        try {
          const snapshot = await this.binanceService.fetchAdsByBank(
            bank.id,
            bank.binancePayType,
            filterConfig,
          );

          if (snapshot.offers.length > 0) {
            const bufferedSnapshot: BufferedSnapshot = {
              bankId: snapshot.bankId,
              capturedAt: snapshot.capturedAt,
              offers: snapshot.offers,
            };
            await this.redisBuffer.push(bufferedSnapshot);
            totalOffers += snapshot.offers.length;
          }

          // Small delay between API calls to avoid rate limiting
          await this.delay(500);
        } catch (error) {
          const errMsg = `Bank ${bank.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errMsg);
          this.logger.error(errMsg);
        }
      }

      this.logger.log(
        `✅ Collection complete: ${activeBanks.length} banks, ${totalOffers} offers buffered`,
      );

      // Send cron status to alert rules that have notifyCronStatus enabled
      await this.notifyCronStatus(activeBanks.length, totalOffers, errors);

      // Check price alerts
      await this.checkPriceAlerts();
    } catch (error) {
      this.logger.error(
        'Snapshot collection failed',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  /**
   * EVERY HOUR: Flush Redis buffer to PostgreSQL via Drizzle.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async flushToDatabase(): Promise<void> {
    this.logger.log('💾 Starting buffer flush to PostgreSQL...');

    try {
      const pending = await this.redisBuffer.getPending();

      if (pending.length === 0) {
        this.logger.log('No pending snapshots to flush');
        return;
      }

      let flushedSnapshots = 0;
      let flushedOffers = 0;

      for (const buffered of pending) {
        try {
          // Insert snapshot row
          const [insertedSnapshot] = await this.db
            .insert(snapshots)
            .values({
              bankId: buffered.bankId,
              capturedAt: new Date(buffered.capturedAt),
            })
            .returning({ id: snapshots.id });

          if (!insertedSnapshot) {
            this.logger.warn('Failed to insert snapshot, no ID returned');
            continue;
          }

          // Insert all offers for this snapshot
          if (buffered.offers.length > 0) {
            await this.db.insert(offers).values(
              buffered.offers.map((offer) => ({
                snapshotId: insertedSnapshot.id,
                rank: offer.rank,
                price: offer.price,
                merchantName: offer.merchantName,
                availableAmount: offer.availableAmount,
                maxSingleTrans: offer.maxSingleTrans,
                minSingleTrans: offer.minSingleTrans,
              })),
            );
            flushedOffers += buffered.offers.length;
          }

          flushedSnapshots++;
        } catch (error) {
          this.logger.error(
            `Failed to flush snapshot for bank ${buffered.bankId}`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      // Clear the buffer after successful flush
      await this.redisBuffer.clear();

      this.logger.log(
        `✅ Flush complete: ${flushedSnapshots} snapshots, ${flushedOffers} offers written to PostgreSQL`,
      );
    } catch (error) {
      this.logger.error(
        'Buffer flush failed',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  /**
   * Check price changes against alert rules and send notifications.
   */
  private async checkPriceAlerts(): Promise<void> {
    try {
      const alertRules = await this.configService.getAlertRules();
      if (alertRules.length === 0) return;

      const activeBanks = await this.configService.getActiveBanks();

      for (const bank of activeBanks) {
        const latest = await this.redisBuffer.getLatest(bank.id);
        if (!latest || latest.offers.length === 0) continue;

        const currentPrice = latest.offers[0]!.price;

        // We need a previous price to compare against. For simplicity,
        // we store the last known price in Redis.
        const prevPriceKey = `bin:price:prev:${bank.id}`;
        const prevPriceStr = await this.getPrevPrice(prevPriceKey);
        await this.setPrevPrice(prevPriceKey, currentPrice);

        if (prevPriceStr === null) continue;

        const previousPrice = prevPriceStr;
        const changePct =
          ((currentPrice - previousPrice) / previousPrice) * 100;

        for (const rule of alertRules) {
          const shouldAlert =
            (rule.type === 'up' && changePct >= rule.thresholdPct) ||
            (rule.type === 'down' && changePct <= -rule.thresholdPct);

          if (shouldAlert) {
            await this.telegramService.sendPriceAlert({
              chatId: rule.telegramChatId,
              direction: rule.type as 'up' | 'down',
              thresholdPct: rule.thresholdPct,
              currentPrice,
              previousPrice,
              bankName: bank.name,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(
        'Price alert check failed',
        error instanceof Error ? error.message : error,
      );
    }
  }

  /**
   * Notify cron status to alert rules with notifyCronStatus enabled.
   */
  private async notifyCronStatus(
    banksProcessed: number,
    totalOffers: number,
    errors: string[],
  ): Promise<void> {
    try {
      const alertRules = await this.configService.getAlertRules();
      const cronStatusRules = alertRules.filter((r) => r.notifyCronStatus);

      // Format timestamp in Caracas time
      const now = new Date();
      const timestamp = now.toLocaleString('es-VE', {
        timeZone: 'America/Caracas',
      });

      for (const rule of cronStatusRules) {
        await this.telegramService.sendCronStatus({
          chatId: rule.telegramChatId,
          banksProcessed,
          totalOffers,
          timestamp,
          errors: errors.length > 0 ? errors : undefined,
        });
      }
    } catch (error) {
      this.logger.error(
        'Cron status notification failed',
        error instanceof Error ? error.message : error,
      );
    }
  }

  /** Helper: get previous price from Redis */
  private async getPrevPrice(key: string): Promise<number | null> {
    try {
      const { Redis } = await import('@upstash/redis');
      // Access Redis through the buffer service's injected instance
      // We use a simpler approach via the buffer service
      const raw = await this.redisBuffer['redis'].get<string>(key);
      if (raw === null || raw === undefined) return null;
      return typeof raw === 'number' ? raw : parseFloat(String(raw));
    } catch {
      return null;
    }
  }

  /** Helper: set previous price in Redis */
  private async setPrevPrice(key: string, price: number): Promise<void> {
    try {
      await this.redisBuffer['redis'].set(key, price.toString(), {
        ex: 7200, // 2 hours
      });
    } catch (error) {
      this.logger.warn('Failed to store prev price', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
