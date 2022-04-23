import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TelegramService } from '../telegram/telegram.service';
import { TelegramRepository } from '../telegram/telegram.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TelegramRepository])],
  controllers: [],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
