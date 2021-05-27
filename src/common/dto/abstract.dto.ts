import { AutoMap } from '@automapper/classes';

export class AbstractDto {
  @AutoMap()
  id: number;

  @AutoMap()
  createdAt: Date;

  @AutoMap()
  updatedAt: Date;
}
