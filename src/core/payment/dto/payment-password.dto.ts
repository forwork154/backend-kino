import { IsNotEmpty } from 'class-validator';

export class PaymentPasswordDto {
  @IsNotEmpty()
  password: string;
}
