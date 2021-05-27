import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from 'src/common/packages/nestjs-crud-service/services';
import { Repository } from 'typeorm';
import { Tag } from './entities';

@Injectable()
export class TagService extends TypeOrmCrudService<Tag> {
  constructor(
    @InjectRepository(Tag)
    repository: Repository<Tag>,
    @InjectMapper() private readonly mapper: Mapper,
  ) {
    super(repository);
  }
}
