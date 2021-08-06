import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class AbstractDto {
  @ApiProperty()
  @AutoMap()
  id: number;

  @ApiProperty()
  @AutoMap()
  createdAt: Date;

  @ApiProperty()
  @AutoMap()
  updatedAt: Date;
}
