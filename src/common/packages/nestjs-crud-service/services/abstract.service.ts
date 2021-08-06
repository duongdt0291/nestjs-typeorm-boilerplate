import { DefaultPageSize } from '../constant';
import { FindManyActionDto, FindOneActionDto } from '../dto';
import { GetPaginatedManyDefaultResponse } from '../dto/get-paginated-many-response.dto';
import { FindCondition, QueryOptions } from '../interfaces';

export abstract class AbstractService<E, CreateDto = E, UpdateDto = CreateDto, DetailDto = E> {
  abstract baseFindOne(query: FindOneActionDto<E>, queryOptions?: QueryOptions): Promise<DetailDto>;

  findOne(query: FindOneActionDto<E>, queryOptions?: QueryOptions) {
    return this.baseFindOne(query, queryOptions);
  }

  abstract baseFindOneOrFail(query: FindOneActionDto<E>, queryOptions?: QueryOptions): Promise<DetailDto>;

  findOneOrFail(query: FindOneActionDto<E>, queryOptions?: QueryOptions) {
    return this.baseFindOneOrFail(query, queryOptions);
  }

  abstract baseFind(query: FindManyActionDto<E>, queryOptions?: QueryOptions): Promise<DetailDto[]>;

  find(query: FindManyActionDto<E>, queryOptions?: QueryOptions) {
    return this.baseFind(query, queryOptions);
  }

  abstract baseList(
    query: FindManyActionDto<E>,
    queryOptions?: QueryOptions,
  ): Promise<GetPaginatedManyDefaultResponse<E>>;

  async list(query: FindManyActionDto<E>, queryOptions?: QueryOptions) {
    return this.baseList(query, queryOptions);
  }

  abstract baseCreate(createDto: CreateDto): Promise<DetailDto>;

  create(createDto: CreateDto) {
    return this.baseCreate(createDto);
  }

  abstract baseBulkCreate({ entities }: { entities: CreateDto[] }): Promise<DetailDto[]>;

  bulkCreate({ entities }: { entities: CreateDto[] }) {
    return this.baseBulkCreate({ entities });
  }

  abstract baseUpdate(id: string | number, updateDto: UpdateDto): Promise<E>;

  update(id: string | number, updateDto: UpdateDto) {
    return this.baseUpdate(id, updateDto);
  }

  abstract baseUpdateOne(criteria: FindOneActionDto<E>, updateDto: Partial<UpdateDto>): Promise<E>;

  updateOne(criteria: FindOneActionDto<E>, updateDto: Partial<UpdateDto>) {
    return this.baseUpdateOne(criteria, updateDto);
  }

  abstract baseUpdateMany(criteria: FindOneActionDto<E>, dto: Partial<UpdateDto>): Promise<E[]>;

  async updateMany(criteria: FindOneActionDto<E>, dto: Partial<UpdateDto>) {
    return this.baseUpdateMany(criteria, dto);
  }

  abstract baseDelete(id: number | string): Promise<E>;

  async delete(id: number | string) {
    return this.baseDelete(id);
  }

  abstract baseDeleteOne(criteria: FindOneActionDto<E>): Promise<E>;

  deleteOne(criteria: FindOneActionDto<E>) {
    return this.baseDeleteOne(criteria);
  }

  abstract baseDeleteMany(criteria: FindOneActionDto<E>): Promise<E[]>;

  deleteMany(criteria: FindOneActionDto<E>) {
    return this.baseDeleteMany(criteria);
  }

  abstract baseSoftDelete(id: number | string): Promise<E>;

  async softDelete(id: number | string) {
    return this.baseSoftDelete(id);
  }

  abstract baseIncrement(
    conditions: FindCondition<E>,
    update: { [index: string]: number },
  ): Promise<{ success: boolean; affected: number }>;

  increment(conditions: FindCondition<E>, update: { [index in keyof E]?: number }) {
    return this.baseIncrement(conditions, update);
  }

  /**
   * Wrap page into page-info
   * override this method to create custom page-info response
   * or set custom `serialize.getMany` dto in the controller's CrudOption
   * @param data
   * @param total
   * @param limit
   * @param page
   */
  protected createPaginationBuilder<E>(
    data: E[],
    total: number,
    limit: number = DefaultPageSize,
    page = 1,
  ): GetPaginatedManyDefaultResponse<E> {
    return {
      data,
      count: data.length,
      total,
      pageSize: limit,
      page,
      pageCount: limit && total ? Math.ceil(total / limit) : 1,
    };
  }
}
