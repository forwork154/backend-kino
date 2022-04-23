import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { join } from 'path';

import * as config from 'config';

export async function bootstrap(): Promise<void> {
  const serverConfig = config.get('API');
  const port = process.env.PORT || serverConfig.PORT;

  process.env['NODE_CONFIG_DIR'] = __dirname;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '../static'), {
    prefix: '/static',
  });
  app.use(compression({ encodings: ['gzip'] }));

  app.enableCors();
  app.use(helmet());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  await app.listen(port);

  const logger = new Logger('Bootstrap Api Server');
  logger.log(`Api Server listening on port ${port}`);
  logger.log(`Api Server URL is http://localhost:${port}`);
}
bootstrap();
