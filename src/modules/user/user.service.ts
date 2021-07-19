import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { After, Before, Service } from 'src/common/packages/nestjs-crud-service/decorators';
import { ServicePopulateOptions } from 'src/common/packages/nestjs-crud-service/interfaces/service-populate-options.interface';
import { TypeOrmCrudService } from 'src/common/packages/nestjs-crud-service/services';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './dtos';
import { User } from './entities/user.entity';

@Injectable()
@Service()
export class UserService extends TypeOrmCrudService<User, CreateUserDto, UpdateUserDto> {
  protected populationMetadata: ServicePopulateOptions[] = [
    {
      property: 'tags',
      type: 'relation',
      eager: true,
      populates: [
        {
          property: 'category',
          type: 'mapOne',
          table: 'tag_categories',
          tableAlias: 'tag_categories',
          eager: true,
          onConditions: 'tags.categoryId = tag_categories.id',
        },
      ],
    },
  ];

  constructor(
    @InjectMapper() private readonly mapper: Mapper,
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository);
  }

  @Before('list')
  beforeList1(query: any) {
    console.log('BEFORE LIST 1', query);
  }

  @Before('list')
  beforeList2(query: any) {
    console.log('BEFORE LIST 2');
  }

  @After('list')
  async afterList(res: any, query: any) {
    console.log('AFTER LIST');
    return res;
  }

  test(query: any) {
    return this.find(
      {
        ...query,
      },
      {
        population: [
          {
            property: 'tags',
            eager: false,
            populates: [
              {
                property: 'category',
              },
            ],
          },
        ],
      },
    );
  }
}
