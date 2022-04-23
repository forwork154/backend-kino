import { IsNotEmpty } from 'class-validator';

export class PaymentSecretDto {
  @IsNotEmpty()
  secret: string;
}
