import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';

import { TelegramUser } from '../core/telegram/telegram-user.entity';

const dbConfig = config.get('DATABASE');

process.env.TZ = 'UTC';

export const ApiEntities = [TelegramUser];

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: dbConfig.TYPE,
  url: process.env.DATABASE_URL || dbConfig.URL,
  entities: ApiEntities,
  ssl: true,
  logging: ['error'],
  synchronize: process.env.DATABASE_SYNCHRONIZE || dbConfig.SYNCHRONIZE,
};
