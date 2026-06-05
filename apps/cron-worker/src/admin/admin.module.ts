import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AppConfigModule } from '../config/config.module.js';

@Module({
  imports: [AppConfigModule],
  controllers: [AdminController],
})
export class AdminModule {}
