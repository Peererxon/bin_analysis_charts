import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketIngestionService } from './market-ingestion.service.js';
import { BinanceModule } from '../binance/binance.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { AppConfigModule } from '../config/config.module.js';

@Module({
  imports: [ScheduleModule.forRoot(), BinanceModule, TelegramModule, AppConfigModule],
  providers: [MarketIngestionService],
})
export class IngestionModule {}
