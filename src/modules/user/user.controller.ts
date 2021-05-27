import { MapInterceptor } from '@automapper/nestjs';
import { Body, Get, Param, Put, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { ApiController, Auth } from 'src/decorators';
import { UserDto } from './dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@ApiController('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  // TODO: xử lý mapper
  // @UseInterceptors(
  //   MapInterceptor(UserDto, User, {
  //     isArray: true,
  //   }),
  // )
  list(@Body() query) {
    return this.userService.list(query);
  }

  @Get(':id')
  @Auth('admin')
  @UseInterceptors(MapInterceptor(UserDto, User))
  findOne(@Param('id') id: number | string) {
    return this.userService.findByPk(id);
  }

  @Put(':id')
  @Auth('admin')
  @ApiOkResponse({
    type: UserDto,
  })
  @UseInterceptors(MapInterceptor(UserDto, User))
  update(@Param('id') id: number | string, @Body() updateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }
}
