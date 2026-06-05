import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';
import { RedisBufferService } from './redis-buffer.service.js';

import { REDIS_TOKEN } from './redis.constants.js';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_TOKEN,
      useFactory: (configService: ConfigService) => {
        return new Redis({
          url: configService.getOrThrow<string>('UPSTASH_REDIS_REST_URL'),
          token: configService.getOrThrow<string>('UPSTASH_REDIS_REST_TOKEN'),
        });
      },
      inject: [ConfigService],
    },
    RedisBufferService,
  ],
  exports: [REDIS_TOKEN, RedisBufferService],
})
export class RedisModule {}
