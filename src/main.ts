import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { EntityNotFoundFilter, QueryFailedFilter } from './filters';
import { ApiConfigService } from './modules/shared/services/api-config.service';
import { SharedModule } from './modules/shared/shared.module';
import { setupSwagger } from './swagger-setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  app.useGlobalFilters(new QueryFailedFilter(), new EntityNotFoundFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // remove all props, which not defined in dto
    }),
  );

  const configService = app.select(SharedModule).get(ApiConfigService);

  if (!configService.documentationEnabled) {
    setupSwagger(app);
  }

  await app.listen(configService.appConfig.port);
}

bootstrap();
