import { MapInterceptor } from '@automapper/nestjs';
import { Body, Get, Param, Put, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { FindManyActionDto } from 'src/common/packages/nestjs-crud-service/dto';
import { ApiController, Auth } from 'src/decorators';
import { MapListInterceptor } from 'src/interceptors';
import { UserResponseDto } from './dtos';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@ApiController('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseInterceptors(
    MapListInterceptor(UserResponseDto, User, {
      isArray: true,
    }),
  )
  list(@Body() query: FindManyActionDto<User>) {
    return this.userService.list(query);
  }

  @Get(':id')
  @Auth('admin')
  @UseInterceptors(MapInterceptor(UserResponseDto, User))
  findOne(@Param('id') id: number) {
    return this.userService.findOne({ where: { id } });
  }

  @Put(':id')
  @Auth('admin')
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @UseInterceptors(MapInterceptor(UserResponseDto, User))
  update(@Param('id') id: number | string, @Body() updateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }
}
