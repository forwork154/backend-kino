import * as config from 'config';

const telegrafConfig = config.get('TELEGRAF');

export const TelegrafConfig = {
  botToken: telegrafConfig.BOT_TOKEN,
};
