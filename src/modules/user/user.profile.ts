import { mapFrom } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/types';
import { Injectable } from '@nestjs/common';
import { UserResponseDto } from './dtos';
import { User } from './entities/user.entity';

@Injectable()
export class UserProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  mapProfile() {
    return (mapper: Mapper) => {
      mapper
        .createMap(User, UserResponseDto)
        .forMember(
          (destination) => destination.fullName,
          mapFrom((source) => `${source.firstName} ${source.lastName}`),
        )
        .forMember(
          (d) => d.tags,
          mapFrom((s) => s.tags),
        );
    };
  }
}
