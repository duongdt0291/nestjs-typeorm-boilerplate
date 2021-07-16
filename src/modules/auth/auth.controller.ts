import { Body, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { ApiController, GetUser } from 'src/decorators';
import { JwtAuthGuard, LoginAuthGuard } from 'src/guards';
import { UserResponseDto } from '../user/dtos';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { LoginResponseDto } from './dtos/login.response.dto';

@ApiController('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOkResponse({
    type: UserResponseDto,
  })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @UseGuards(LoginAuthGuard)
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    const token = await this.authService.getAccessToken(body);

    return { token };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    type: UserResponseDto,
  })
  me(@GetUser() user: UserResponseDto) {
    return user;
  }
}
