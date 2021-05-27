import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from './config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from './snake-naming-strategy';

@Module({
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
        entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
        logging: ['query', 'error', 'info', 'log'],
      }),
    }),
    UserModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
