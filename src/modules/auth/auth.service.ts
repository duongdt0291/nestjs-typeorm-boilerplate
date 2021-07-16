import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UserResponseDto } from '../user/dtos';
import { User } from '../user/entities';
import { UserService } from '../user/user.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new NotFoundException('Email hoặc mật khẩu không chính xác');
    }

    const isRightPassword = await bcrypt.compare(password, user.password);

    if (!isRightPassword) {
      throw new NotFoundException('Email hoặc mật khẩu không chính xác');
    }

    return this.mapper.map(user, UserResponseDto, User);
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userService.create({
      ...registerDto,
      password: hashedPassword,
    });

    return user;
  }

  async getAccessToken(user: LoginDto) {
    return this.jwtService.sign({ sub: user.email });
  }
}
