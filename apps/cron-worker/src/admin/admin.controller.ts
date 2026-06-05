import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { eq, desc, banks, appConfig, alertRules, snapshots } from '@bin-analysis/db';
import type { Database, NewBank, NewAlertRule } from '@bin-analysis/db';
import { DATABASE_TOKEN } from '../database/database.module.js';
import { AppConfigService } from '../config/config.service.js';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly configService: AppConfigService,
  ) {}

  // ─── Banks CRUD ─────────────────────────────────────────────────────

  @Get('banks')
  async getBanks() {
    const result = await this.db.select().from(banks);
    return { data: result };
  }

  @Post('banks')
  async createBank(
    @Body() body: { name: string; binancePayType: string },
  ) {
    if (!body.name || !body.binancePayType) {
      throw new HttpException(
        'name and binancePayType are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const [created] = await this.db
        .insert(banks)
        .values({
          name: body.name,
          binancePayType: body.binancePayType,
          isActive: true,
        } satisfies NewBank)
        .returning();

      await this.configService.invalidateCache();
      this.logger.log(`Bank created: ${body.name}`);
      return { data: created };
    } catch (error) {
      throw new HttpException(
        `Failed to create bank: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('banks/:id')
  async updateBank(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; binancePayType?: string; isActive?: boolean },
  ) {
    const updates: Partial<{ name: string; binancePayType: string; isActive: boolean }> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.binancePayType !== undefined) updates.binancePayType = body.binancePayType;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const [updated] = await this.db
      .update(banks)
      .set(updates)
      .where(eq(banks.id, id))
      .returning();

    if (!updated) {
      throw new HttpException('Bank not found', HttpStatus.NOT_FOUND);
    }

    await this.configService.invalidateCache();
    this.logger.log(`Bank ${id} updated`);
    return { data: updated };
  }

  @Delete('banks/:id')
  async deleteBank(@Param('id', ParseIntPipe) id: number) {
    const [deleted] = await this.db
      .delete(banks)
      .where(eq(banks.id, id))
      .returning();

    if (!deleted) {
      throw new HttpException('Bank not found', HttpStatus.NOT_FOUND);
    }

    await this.configService.invalidateCache();
    this.logger.log(`Bank ${id} deleted`);
    return { message: 'Bank deleted', data: deleted };
  }

  // ─── Filter Config ─────────────────────────────────────────────────

  @Get('config')
  async getConfig() {
    const filterConfig = await this.configService.getFilterConfig();
    return { data: filterConfig };
  }

  @Put('config')
  async updateConfig(
    @Body() body: { min_capital_usd?: number; min_max_offer_pct?: number },
  ) {
    const updates: { key: string; value: string }[] = [];

    if (body.min_capital_usd !== undefined) {
      updates.push({
        key: 'min_capital_usd',
        value: String(body.min_capital_usd),
      });
    }
    if (body.min_max_offer_pct !== undefined) {
      updates.push({
        key: 'min_max_offer_pct',
        value: String(body.min_max_offer_pct),
      });
    }

    for (const update of updates) {
      await this.db
        .insert(appConfig)
        .values({ key: update.key, value: update.value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: appConfig.key,
          set: { value: update.value, updatedAt: new Date() },
        });
    }

    await this.configService.invalidateCache();
    this.logger.log('Filter config updated');

    const updated = await this.configService.getFilterConfig();
    return { data: updated };
  }

  // ─── Alert Rules CRUD ──────────────────────────────────────────────

  @Get('alerts')
  async getAlertRules() {
    const result = await this.db.select().from(alertRules);
    return { data: result };
  }

  @Post('alerts')
  async createAlertRule(
    @Body()
    body: {
      type: 'up' | 'down';
      thresholdPct: number;
      telegramChatId: string;
      notifyCronStatus?: boolean;
    },
  ) {
    if (!body.type || !body.thresholdPct || !body.telegramChatId) {
      throw new HttpException(
        'type, thresholdPct, and telegramChatId are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const [created] = await this.db
      .insert(alertRules)
      .values({
        type: body.type,
        thresholdPct: body.thresholdPct,
        telegramChatId: body.telegramChatId,
        notifyCronStatus: body.notifyCronStatus ?? false,
        isActive: true,
      } satisfies NewAlertRule)
      .returning();

    await this.configService.invalidateCache();
    this.logger.log(`Alert rule created: ${body.type} ${body.thresholdPct}%`);
    return { data: created };
  }

  @Put('alerts/:id')
  async updateAlertRule(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      type?: 'up' | 'down';
      thresholdPct?: number;
      telegramChatId?: string;
      isActive?: boolean;
      notifyCronStatus?: boolean;
    },
  ) {
    const updates: Record<string, unknown> = {};
    if (body.type !== undefined) updates.type = body.type;
    if (body.thresholdPct !== undefined) updates.thresholdPct = body.thresholdPct;
    if (body.telegramChatId !== undefined) updates.telegramChatId = body.telegramChatId;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.notifyCronStatus !== undefined) updates.notifyCronStatus = body.notifyCronStatus;

    const [updated] = await this.db
      .update(alertRules)
      .set(updates)
      .where(eq(alertRules.id, id))
      .returning();

    if (!updated) {
      throw new HttpException('Alert rule not found', HttpStatus.NOT_FOUND);
    }

    await this.configService.invalidateCache();
    this.logger.log(`Alert rule ${id} updated`);
    return { data: updated };
  }

  @Delete('alerts/:id')
  async deleteAlertRule(@Param('id', ParseIntPipe) id: number) {
    const [deleted] = await this.db
      .delete(alertRules)
      .where(eq(alertRules.id, id))
      .returning();

    if (!deleted) {
      throw new HttpException('Alert rule not found', HttpStatus.NOT_FOUND);
    }

    await this.configService.invalidateCache();
    this.logger.log(`Alert rule ${id} deleted`);
    return { message: 'Alert rule deleted', data: deleted };
  }

  // ─── Cron Status ───────────────────────────────────────────────────

  @Get('status')
  async getCronStatus() {
    // Get the most recent snapshot timestamp
    const [latestSnapshot] = await this.db
      .select({ capturedAt: snapshots.capturedAt })
      .from(snapshots)
      .orderBy(desc(snapshots.capturedAt))
      .limit(1);

    return {
      data: {
        lastSnapshotAt: latestSnapshot?.capturedAt ?? null,
        serverTime: new Date().toLocaleString('es-VE', {
          timeZone: 'America/Caracas',
        }),
      },
    };
  }
}
