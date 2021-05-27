import { Body, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { ApiController, GetUser } from 'src/decorators';
import { JwtAuthGuard, LoginAuthGuard } from 'src/guards';
import { UserDto } from '../user/dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResLoginDto } from './dto/res-login.dto';

@ApiController('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOkResponse({
    type: UserDto,
  })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @UseGuards(LoginAuthGuard)
  @ApiOkResponse({
    type: ResLoginDto,
  })
  async login(@Body() body: LoginDto): Promise<ResLoginDto> {
    const token = await this.authService.getAccessToken(body);

    return { token };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    type: UserDto,
  })
  me(@GetUser() user: UserDto) {
    return user;
  }
}
