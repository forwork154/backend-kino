import { IsNotEmpty } from 'class-validator';

export class PaymentCodeDto {
  @IsNotEmpty()
  code: number;
}
