import { IsNotEmpty } from 'class-validator';

export class PaymentBalanceDto {
  @IsNotEmpty()
  balance: number;
}
