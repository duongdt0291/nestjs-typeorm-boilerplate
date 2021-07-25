import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import path from 'path';
import { SnakeNamingStrategy } from 'src/snake-naming-strategy';

@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  private getNumber(key: string, defaultValue?: number): number {
    const value = this.configService.get(key, defaultValue);
    if (value === undefined) {
      throw new Error(key + ' env var not set'); // probably we should call process.exit() too to avoid locking the service
    }
    try {
      return Number(value);
    } catch {
      throw new Error(key + ' env var is not a number');
    }
  }

  private getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.configService.get(key, defaultValue?.toString());
    if (value === undefined) {
      throw new Error(key + ' env var not set');
    }
    try {
      return Boolean(JSON.parse(value));
    } catch {
      throw new Error(key + ' env var is not a boolean');
    }
  }

  private getString(key: string, defaultValue?: string): string {
    const value = this.configService.get(key, defaultValue);

    if (!value) {
      console.warn(`"${key}" environment variable is not set`);
      return;
    }
    return value.toString().replace(/\\n/g, '\n');
  }

  get nodeEnv(): string {
    return this.getString('NODE_ENV', 'development');
  }

  get typeOrmConfig(): TypeOrmModuleOptions {
    const entities = [__dirname + '/../../**/*.entity{.ts,.js}'];
    const migrations = [path.join(__dirname, '/../../../migrations/*{.ts,.js}')];

    return {
      entities,
      migrations,
      keepConnectionAlive: true,
      type: this.getString('DB_TYPE') as any,
      host: this.getString('DB_HOST'),
      port: this.getNumber('DB_PORT'),
      username: this.getString('DB_USERNAME'),
      password: this.getString('DB_PASSWORD'),
      database: this.getString('DB_DATABASE'),
      migrationsRun: true,
      logging: this.getBoolean('ENABLE_ORMLOGS', this.isDevelopment),
      namingStrategy: new SnakeNamingStrategy(),
    };
  }

  get awsS3Config() {
    return {
      bucketRegion: this.getString('AWS_S3_BUCKET_REGION'),
      bucketApiVersion: this.getString('AWS_S3_API_VERSION'),
      bucketName: this.getString('AWS_S3_BUCKET_NAME'),
    };
  }

  get documentationEnabled(): boolean {
    return this.getBoolean('ENABLE_DOCUMENTATION', !this.isProduction);
  }

  get authConfig() {
    return {
      jwtSecret: this.getString('JWT_SECRET_KEY'),
      jwtExpirationTime: this.getString('JWT_EXPIRATION_TIME'),
    };
  }

  get appConfig() {
    return {
      port: this.getString('PORT'),
    };
  }
}
