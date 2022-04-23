import { EntityRepository, Repository } from 'typeorm';

import { TelegramUser } from './telegram-user.entity';

@EntityRepository(TelegramUser)
export class TelegramRepository extends Repository<TelegramUser> {}
