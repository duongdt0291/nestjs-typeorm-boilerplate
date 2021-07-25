import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApiConfigService } from '../shared/services/api-config.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/login.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ApiConfigService],
      useFactory: (configService: ApiConfigService) => ({
        secret: configService.authConfig.jwtSecret,
        signOptions: {
          expiresIn: configService.authConfig.jwtExpirationTime,
        },
      }),
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
