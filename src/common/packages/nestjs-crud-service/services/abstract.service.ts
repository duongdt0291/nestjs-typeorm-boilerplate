import { FindOneActionDto } from '../dto';
import { GetPaginatedManyDefaultResponse } from '../dto/get-paginated-many-response.dto';
import { FindCondition } from '../interfaces';

export abstract class AbstractService<E, CreateDto = E, UpdateDto = CreateDto, DetailDto = E> {
  abstract findByPk(id: number | string): Promise<DetailDto>;

  abstract findByPkOrFail(id: any): Promise<DetailDto>;

  abstract findOne(query: FindOneActionDto<E>): Promise<DetailDto>;

  abstract findOneOrFail(query: FindOneActionDto<E>): Promise<DetailDto>;

  abstract find(query: any): Promise<DetailDto[]>;

  //   abstract list(query: any): Promise<T[]>;

  abstract create(createDto: CreateDto): Promise<DetailDto>;

  // abstract bulkCreate({
  //   entities,
  // }: {
  //   entities: CreateDto[];
  // }): Promise<DetailDto[]>;

  abstract update(id: string | number, updateDto: UpdateDto): Promise<E>;

  // updateOne

  // updateMany

  // delete

  // deleteOne

  // deleteMany

  // abstract softDelete(conditions: FindCondition<E>): Promise<any>;

  abstract increment(
    conditions: FindCondition<E>,
    update: { [index: string]: number },
  ): Promise<{ success: boolean; affected: number }>;

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
    limit: number,
    page: number,
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
