import { IsNotEmpty } from 'class-validator';

export class PaymentTanDto {
  @IsNotEmpty()
  tan: string;
}
