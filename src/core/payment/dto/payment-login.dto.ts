import { IsNotEmpty } from 'class-validator';

export class PaymentLoginDto {
  @IsNotEmpty()
  login: string;
}
