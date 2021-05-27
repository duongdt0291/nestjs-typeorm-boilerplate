import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserProfile } from './user.profile';
import { Tag, User } from './entities';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, User])],
  controllers: [UserController, TagController],
  providers: [UserService, UserProfile, TagService],
  exports: [UserService],
})
export class UserModule {}
