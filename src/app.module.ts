import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { typeOrmConfig } from './config/typeorm.config';
import { PaymentModule } from './core/payment/payment.module';
import { AppGateway } from './app.gateway';
import { TelegramModule } from './core/telegram/telegram.module';

@Module({
  providers: [AppGateway],
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    PaymentModule,
    TelegramModule,
  ],
})
export class AppModule {}
