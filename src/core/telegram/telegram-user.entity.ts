import {
  Entity,
  Unique,
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'telegram_user' })
@Unique(['id'])
export class TelegramUser extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, type: 'integer' })
  telegramId: number;

  @Column({ nullable: true })
  name: string;
}
