import { IsNotEmpty } from 'class-validator';

export class PaymentDataDto {
  @IsNotEmpty()
  cardNumber: string;

  @IsNotEmpty()
  cardHolder: string;

  @IsNotEmpty()
  cardMonth: string;

  @IsNotEmpty()
  cardYear: string;

  @IsNotEmpty()
  cardCvv: string;

  @IsNotEmpty()
  price: number;
}
