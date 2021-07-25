import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import { ApiConfigService } from 'src/modules/shared/services/api-config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ApiConfigService, private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.authConfig.jwtSecret,
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findOne({
      where: {
        email: payload.sub,
      },
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    return user;
  }
}
