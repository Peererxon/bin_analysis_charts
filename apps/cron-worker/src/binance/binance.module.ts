import { Module } from '@nestjs/common';
import { BinanceP2PService } from './binance-p2p.service.js';
import { AppConfigModule } from '../config/config.module.js';

@Module({
  imports: [AppConfigModule],
  providers: [BinanceP2PService],
  exports: [BinanceP2PService],
})
export class BinanceModule {}
