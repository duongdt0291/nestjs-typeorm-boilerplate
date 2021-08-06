import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { config } from '../../config';
import { SnakeNamingStrategy } from '../../snake-naming-strategy';
import { UserModule } from './user.module';
import request from 'supertest';
import { Tag, User } from './entities';
import { TagCategory } from './entities/tag-category.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AutomapperModule.forRoot({
          options: [{ name: 'blah', pluginInitializer: classes }],
          singular: true,
        }),
        ConfigModule.forRoot({
          envFilePath: ['.env'],
          isGlobal: true,
          load: [config],
        }),
        ThrottlerModule.forRoot({
          ttl: 60,
          limit: 100,
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            ...configService.get('database'),
            namingStrategy: new SnakeNamingStrategy(),
            entities: [User, Tag, TagCategory],
            logging: ['query', 'error', 'info', 'log'],
          }),
        }),
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  afterAll(async () => {
    await app.close();
  });
});
