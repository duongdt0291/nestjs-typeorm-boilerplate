import { BadRequestException } from '@nestjs/common';
import { isNotEmptyObject } from 'class-validator';
import { intersection, isNil, isObject, merge, set } from 'lodash';
import {
  Brackets,
  ConnectionOptions,
  EntityMetadata,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
  WhereExpression,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { FindManyActionDto, FindOneActionDto, PopulateItem, SortOptions } from '../dto';
import { FindCondition, MergedPopulateOptions, QueryOperator, QueryOptions, QueryPopulateOptions } from '../interfaces';
import { ServicePopulateOptions } from '../interfaces/service-populate-options.interface';
import { hasOwnPropName, isArrayNotEmpty } from '../utils';
import { AbstractService } from './abstract.service';

/*
 * MapObjectOperator for checking operator valid and generate unique param in query
 */
const MapObjectOperator = {
  $eq: 'eq',
  $ne: 'ne',
  $not: 'not',
  $gt: 'gt',
  $gte: 'gte',
  $lt: 'lt',
  $lte: 'lte',
  $between: 'between',
  $notBetween: 'notBetween',
  $in: 'in',
  $nin: 'nin',
  $starts: 'starts',
  $cont: 'cont',
  $ends: 'ends',
  $notLike: 'notLike',
  $isNull: true,
  $isNotNull: true,
  $field: true,
  $eqL: 'eqL',
  $neL: 'neL',
  $startsL: 'startsL',
  $endsL: 'endsL',
  $contL: 'contL',
  $exclL: 'exclL',
};

export class TypeOrmCrudService<Entity, CreateDto = Entity, UpdateDto = Entity> extends AbstractService<
  Entity,
  CreateDto,
  UpdateDto,
  Entity
> {
  protected dbName: ConnectionOptions['type'];

  protected entityColumns: string[];

  protected entityPrimaryColumns: string[];

  protected entityHasDeleteColumn = false;

  protected entityColumnsHash: ObjectLiteral = {};

  protected sqlInjectionRegEx: RegExp[] = [
    /(%27)|(\')|(--)|(%23)|(#)/gi,
    /((%3D)|(=))[^\n]*((%27)|(\')|(--)|(%3B)|(;))/gi,
    /w*((%27)|(\'))((%6F)|o|(%4F))((%72)|r|(%52))/gi,
    /((%27)|(\'))union/gi,
  ];

  protected defaultSort: SortOptions = { id: 'DESC' };

  protected populationMetadata: ServicePopulateOptions[] = [];

  constructor(protected repository: Repository<Entity>) {
    super();
    this.dbName = this.repository.metadata.connection.options.type;
    this.onInitMapEntityColumns();
  }

  protected get entityType() {
    return this.repository.target;
  }

  protected get tableAlias() {
    return this.repository.metadata.tableName;
  }

  protected get likeOperator() {
    return this.dbName === 'postgres' ? 'ILIKE' : 'LIKE';
  }

  findOne(query: FindOneActionDto<Entity>, queryOptions?: QueryOptions) {
    const builder = this.createBuilder(query, false, queryOptions);

    return builder.getOne();
  }

  findOneOrFail(query: FindOneActionDto<Entity>, queryOptions?: QueryOptions) {
    const builder = this.createBuilder(query, false, queryOptions);

    return builder.getOneOrFail();
  }

  find(query: FindManyActionDto<Entity>, queryOptions?: QueryOptions) {
    const builder = this.createBuilder(query, true, queryOptions);

    return builder.getMany();
  }

  async list(query: FindManyActionDto<Entity>, queryOptions?: QueryOptions) {
    const builder = this.createBuilder(query, true, queryOptions);
    const [data, total] = await builder.getManyAndCount();

    return this.createPaginationBuilder<Entity>(data, total, query.pageSize, query.page);
  }

  create(createDto: CreateDto) {
    const entity = this.repository.create(createDto);

    return this.repository.save(entity);
  }

  async update(id: number | string, updateDto: UpdateDto) {
    const entity = await this.repository.findOneOrFail(id);

    return this.repository.save(merge(entity, updateDto) as Entity);
  }

  async replace(updateDto: UpdateDto) {
    const entity = await this.repository.findOneOrFail((updateDto as any).id);

    return this.repository.save(merge(entity, updateDto));
  }

  async updateMany(criteria: FindOneActionDto<Entity>, dto: UpdateDto) {
    return this.createBuilder(criteria, false).update().set(dto).execute();
  }

  async delete(id: number | string) {
    const entity = await this.repository.findOneOrFail(id);

    return this.repository.remove(entity);
  }

  async deleteMany(criteria: FindOneActionDto<Entity>) {
    const entities = await this.createBuilder(criteria, false).getMany();

    return this.repository.remove(entities);
  }

  async softDelete(id: number | string) {
    if (!this.entityHasDeleteColumn) {
      throw new Error('Be sure you declared DeleteDateColumn in schema');
    }

    const entity = await this.repository.findOneOrFail(id);

    return this.repository.softRemove(entity);
  }

  /*
   * Only update for given entity, not for relation entity
   */
  increment(conditions: FindCondition<Entity>, value: { [key in keyof Entity]?: number }) {
    if (!Object.entries(value)?.length) {
      throw new BadRequestException();
    }

    const setObj: QueryDeepPartialEntity<Entity> = {};

    Object.entries(value).forEach(([key, value]) => set(setObj, key, () => `${key} + ${value}`));

    const builder = this.repository.createQueryBuilder(this.tableAlias);

    this.setConditions(builder, conditions);

    return builder
      .update()
      .set(setObj)
      .execute()
      .then((res) => ({
        success: true,
        affected: res.affected,
      }))
      .catch((err) => {
        console.error(`increment ${this.tableAlias}`, err);
        throw err;
      });
  }

  protected createBuilder(query: FindManyActionDto<Entity>, getMany = true, queryOptions: QueryOptions = {}) {
    const builder = this.repository.createQueryBuilder(this.tableAlias);

    if (!query?.where) {
      query.where = {};
    }

    // Order handle Join => selectField => condition => sort order => skip, take is important
    // It prevents some tricky bugs with TypeOrm
    this.setPopulates(builder, query.populates, queryOptions?.population);

    if (isArrayNotEmpty(query.fields)) {
      this.setSelectedFields(builder, query.fields);
    }

    if (isArrayNotEmpty(queryOptions?.includeHiddenFields)) {
      builder.addSelect(queryOptions.includeHiddenFields);
    }

    this.setConditions(builder, query.where);

    if (query.search && isArrayNotEmpty(query.searchFields)) {
      this.setSearch(builder, query.search, query.searchFields, queryOptions?.allowedSearchFields);
    }

    if (queryOptions.includeDeleted && this.entityHasDeleteColumn) {
      builder.withDeleted();
    }

    if (isNotEmptyObject(query.sort)) {
      this.setSort(builder, query.sort);
    }

    if (getMany) {
      let take = query.pageSize || 100;
      const skip = take * ((query.page || 1) - 1);

      if (queryOptions?.maxLimit && take > queryOptions.maxLimit) {
        take = queryOptions.maxLimit;
      }

      builder.take(take);
      if (skip) {
        builder.skip(skip);
      }
    }

    return builder;
  }

  protected setPopulates(
    builder: SelectQueryBuilder<any>,
    populates: PopulateItem[] = [],
    allowedPopulates: QueryPopulateOptions[] = [],
  ) {
    const allow = this.getAllowedPopulation(allowedPopulates);

    if (!allow.length) {
      return;
    }

    const p = this.getAllowedPopulation(populates as any, allow);

    // add eager populate
    allow
      .filter((a) => a.eager)
      .forEach((a) => {
        if (!p.find((e) => e.property === a.property)) {
          p.push(a);
        }
      });

    p.forEach((populate) => {
      this.setJoin(populate, builder);
    });
  }

  setJoin(populate: any, builder: SelectQueryBuilder<Entity>, parentAlias = this.tableAlias) {
    let args;

    if (populate.method.endsWith('Select')) {
      args = [
        `${parentAlias}.${populate.table || populate.property}`,
        populate.tableAlias || populate.table || populate.property,
        populate.onConditions,
      ];
    } else {
      args = [`${parentAlias}.${populate.property}`, populate.table, populate.tableAlias, populate.onConditions];
    }

    (builder as any)[populate.method](...args);

    if (populate.populates) {
      populate.populates.forEach((p) => this.setJoin(p, builder, populate.property));
    }
  }

  protected getJoinMethod(type: 'relation' | 'mapOne' | 'mapMany', required = false) {
    const MapTypeJoin = {
      relation_innerJoin: 'innerJoinAndSelect',
      relation_leftJoin: 'leftJoinAndSelect',
      mapOne_innerJoin: 'innerJoinAndMapOne',
      mapOne_leftJoin: 'leftJoinAndMapOne',
      mapMany_innerJoin: 'innerJoinAndMapMany',
      mapMany_leftJoin: 'leftJoinAndMapMany',
    };

    return MapTypeJoin[`${type}_${required ? 'innerJoin' : 'leftJoin'}`];
  }

  protected getAllowedPopulation(queryPopulateOptions: QueryPopulateOptions[], source: any = this.populationMetadata) {
    const allow: MergedPopulateOptions[] = [];

    if (!queryPopulateOptions?.length && source?.length) {
      return this.getAllowedPopulation(source, source);
    }

    queryPopulateOptions.forEach((queryOption) => {
      const match = source.find((servicePopulateOption) => servicePopulateOption.property === queryOption.property);

      let childPopulates;
      if (queryOption?.populates?.length && match?.populates?.length) {
        childPopulates = this.getAllowedPopulation(queryOption.populates, match.populates);
      }

      if (match) {
        allow.push({
          ...match,
          populates: childPopulates,
          required: hasOwnPropName(queryOption, 'eager') ? queryOption.eager : match.eager,
          onConditions: queryOption.onConditions
            ? `${match.onConditions} AND (${queryOption.onConditions})`
            : match.onConditions,
          eager: hasOwnPropName(queryOption, 'eager') ? queryOption.eager : match.eager,
          method: this.getJoinMethod(match.type),
        });
      }
    });

    return allow;
  }

  protected setConditions(
    builder: SelectQueryBuilder<Entity> | WhereExpression,
    conditions: FindCondition<any> | QueryOperator<any>,
    parentField: string = this.tableAlias,
    hasWhere = false,
  ) {
    Object.entries(conditions).forEach(([field, value]) => {
      const method = hasWhere ? 'andWhere' : 'where';

      if (field === '$or') {
        return builder[method](new Brackets((b) => this.setOrCondition(b, value, parentField)));
      }

      if (MapObjectOperator[field]) {
        hasWhere = true;
        const { str, params } = this.mapOperatorsToQuery(parentField, field, value);
        return builder[method](str, params);
      }

      const cols = parentField.split('.');
      switch (cols.length) {
        case 1:
          parentField = parentField;
          break;
        default:
          parentField = cols[1];
      }

      if (isObject(value)) {
        return this.setConditions(
          builder as unknown as SelectQueryBuilder<Entity>,
          value,
          `${parentField}.${field}`,
          true,
        );
      }

      hasWhere = true;
      builder[method](`${parentField}.${field} = (:${parentField}.${field})`, {
        [`${parentField}.${field}`]: value,
      });
    });
  }

  protected mapOperatorsToQuery(field: string, operator: string, value: any): { str: string; params: ObjectLiteral } {
    const fieldWithAlias = field.includes('.') ? field : `${this.tableAlias}.${field}`;
    const parentField = field.includes('.') ? field.split('.')[0] : this.tableAlias;
    const param = `${fieldWithAlias}_${MapObjectOperator[operator]}`;
    let str: string;
    let params: ObjectLiteral;

    switch (operator) {
      case '$eq':
        str = `${fieldWithAlias} = (:${param})`;
        break;
      case '$ne':
        str = `${fieldWithAlias} != (:${param})`;
        break;
      case '$gt':
        str = `${fieldWithAlias} > (:${param})`;
        break;
      case '$lt':
        str = `${fieldWithAlias} < (:${param})`;
        break;
      case '$gte':
        str = `${fieldWithAlias} >= (:${param})`;
        break;
      case '$lte':
        str = `${fieldWithAlias} <= (:${param})`;
        break;
      case '$starts':
        str = `${fieldWithAlias} LIKE (:${param})`;
        params = { [param]: `${value}%` };
        break;
      case '$ends':
        str = `${fieldWithAlias} LIKE (:${param})`;
        params = { [param]: `%${value}` };
        break;
      case '$cont':
        str = `${fieldWithAlias} LIKE (:${param})`;
        params = { [param]: `%${value}%` };
        break;
      case '$excl':
        str = `${fieldWithAlias} NOT LIKE (:${param})`;
        params = { [param]: `%${value}%` };
        break;
      case '$in':
        this.checkFilterIsArray(field, value);
        str = `${fieldWithAlias} IN (:...${param})`;
        break;
      case '$nin':
        this.checkFilterIsArray(field, value);
        str = `${fieldWithAlias} NOT IN (:...${param})`;
        break;
      case '$isNull':
        str = `${fieldWithAlias} IS NULL`;
        params = {};
        break;
      case '$notNull':
        str = `${fieldWithAlias} IS NOT NULL`;
        params = {};
        break;
      case '$between':
        this.checkFilterIsArray(field, value, 2);
        str = `${fieldWithAlias} BETWEEN :${param}0 AND :${param}1`;
        params = {
          [`${param}0`]: value[0],
          [`${param}1`]: value[1],
        };
        break;

      // case insensitive
      case '$eqL':
        str = `LOWER(${fieldWithAlias}) = :${param}`;
        break;
      case '$neL':
        str = `LOWER(${fieldWithAlias}) != :${param}`;
        break;
      case '$startsL':
        str = `LOWER(${fieldWithAlias}) ${this.likeOperator} :${param}`;
        params = { [param]: `${value}%` };
        break;
      case '$endsL':
        str = `LOWER(${fieldWithAlias}) ${this.likeOperator} :${param}`;
        params = { [param]: `%${value}` };
        break;
      case '$contL':
        str = `LOWER(${fieldWithAlias}) ${this.likeOperator} :${param}`;
        params = { [param]: `%${value}%` };
        break;
      case '$exclL':
        str = `LOWER(${fieldWithAlias}) NOT ${this.likeOperator} :${param}`;
        params = { [param]: `%${value}%` };
        break;
      case '$field':
        str = `${fieldWithAlias} = ${parentField}.${value}`;
        params = {};
        break;
      /* istanbul ignore next */
      default:
        throw new BadRequestException(`Operator ${operator} Not Supported`);
    }

    if (typeof params === 'undefined') {
      params = { [param]: value };
    }

    return { str, params };
  }

  protected checkFilterIsArray(field: string, value: any[], withLength?: number) {
    /* istanbul ignore if */
    if (!Array.isArray(value) || (isNil(withLength) ? false : value?.length !== withLength ? true : false)) {
      throw new BadRequestException(`Invalid column ${field} value`);
    }
  }

  protected setOrCondition(
    builder: SelectQueryBuilder<Entity> | WhereExpression,
    conditions: FindCondition<Entity>[],
    parentField: string,
  ) {
    conditions.forEach((condition, index) => {
      const method = +index ? 'andWhere' : 'where';
      if (isObject(condition)) {
        throw new Error();
      }

      builder[method](new Brackets((b) => this.setConditions(b, condition, parentField)));
    });
  }

  protected setSearch(
    builder: SelectQueryBuilder<Entity>,
    search: string,
    searchFields: string[],
    allowedSearchFields?: string[],
  ) {
    // const method = builder.getSql().search(/where/i) !== -1 ? 'andWhere' : 'where';
    const searchValue = `%${search}%`;
    const fields = allowedSearchFields?.length ? intersection(searchFields, allowedSearchFields) : searchFields;

    if (!fields.length) {
      return;
    }

    builder.andWhere(
      new Brackets((b) => {
        fields.forEach((field, index) => {
          return b[+index ? 'orWhere' : 'where'](
            `${this.tableAlias}.${field} ${this.likeOperator} :searchValue`,
            +index
              ? null
              : {
                  searchValue,
                },
          );
        });
      }),
    );
  }

  protected setSelectedFields(builder: SelectQueryBuilder<Entity>, fields: string[]) {
    const selectFields: string[] = [];

    fields.forEach((field) => {
      if (!field.includes('.')) {
        return selectFields.push(`${this.tableAlias}.${field}`);
      }
      selectFields.push(field);
    });

    builder.select(selectFields);
  }

  protected setSort(builder: SelectQueryBuilder<Entity>, querySort: SortOptions) {
    const sorts = Object.entries(querySort);

    if (sorts?.length) {
      return sorts.forEach(([field, order], index) => {
        if (+index) {
          return builder.addOrderBy(`${this.tableAlias}.${field}`, order);
        }
        builder.orderBy(`${this.tableAlias}.${field}`, order);
      });
    }

    if (this.defaultSort) {
      this.setSort(builder, this.defaultSort);
    }
  }

  protected onInitMapEntityColumns() {
    this.entityColumns = this.repository.metadata.columns.map((prop) => {
      // In case column is an embedded, use the propertyPath to get complete path
      if (prop.embeddedMetadata) {
        this.entityColumnsHash[prop.propertyPath] = prop.databasePath;
        return prop.propertyPath;
      }
      this.entityColumnsHash[prop.propertyName] = prop.databasePath;
      return prop.propertyName;
    });

    this.entityPrimaryColumns = this.repository.metadata.columns
      .filter((prop) => prop.isPrimary)
      .map((prop) => prop.propertyName);

    this.entityHasDeleteColumn = this.repository.metadata.columns.filter((prop) => prop.isDeleteDate).length > 0;
  }

  protected getEntityColumns(entityMetadata: EntityMetadata): {
    columns: string[];
    primaryColumns: string[];
  } {
    const columns = entityMetadata.columns.map((prop) => prop.propertyPath) || /* istanbul ignore next */ [];
    const primaryColumns =
      entityMetadata.primaryColumns.map((prop) => prop.propertyPath) || /* istanbul ignore next */ [];

    return { columns, primaryColumns };
  }
}
