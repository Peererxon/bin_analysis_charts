import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { RedisModule } from './redis/redis.module.js';
import { BinanceModule } from './binance/binance.module.js';
import { TelegramModule } from './telegram/telegram.module.js';
import { IngestionModule } from './ingestion/ingestion.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    // Core infrastructure
    AppConfigModule,
    DatabaseModule,
    RedisModule,

    // Business logic
    BinanceModule,
    TelegramModule,
    IngestionModule,

    // HTTP API
    AdminModule,
  ],
})
export class AppModule {}
