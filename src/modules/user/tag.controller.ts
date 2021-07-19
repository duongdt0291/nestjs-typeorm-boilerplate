import { Get, Query } from '@nestjs/common';
import { FindManyActionDto } from 'src/common/packages/nestjs-crud-service/dto';
import { ApiController } from 'src/decorators';
import { Tag } from './entities';
import { TagService } from './tag.service';

@ApiController('/tag')
export class TagController {
  constructor(readonly service: TagService) {}

  @Get()
  list(@Query() query: FindManyActionDto<Tag>) {
    return this.service.list(query);
  }
}
