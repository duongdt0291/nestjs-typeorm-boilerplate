import { BadRequestException } from '@nestjs/common';
import { snakeCase } from 'change-case';
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
import { DefaultPageSize } from '../constant';
import { FindManyActionDto, FindOneActionDto, PopulateItem, SearchType, SortOptions } from '../dto';
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

  /*
   * Sử dụng trong trường hợp dùng camelCase ngoài code, nhưng bên trong typeorm vẫn generate ra snakeCase,
   * do với các phương thức map (leftJoinAndMapOne/Many,...),
   * khi generate điều kiện where, không thể dùng trường theo kiểu camelCase đã khai báo trong entity (typeorm sẽ ko biết để convert như các trường được khai báo bởi quan hệ: ManyToOne,...)
   * mà phải dùng table alias của bảng cần join.
   */
  protected populateAliasMapper: Record<string, string>;

  setPopulateAliasMapper() {
    this.populateAliasMapper = this.populationMetadata
      ? this.generatePopulateAliasMapper({}, this.populationMetadata)
      : {};
  }

  generatePopulateAliasMapper(
    res: Record<string, string>,
    populationMetadata: ServicePopulateOptions[],
    parentAlias?: string,
  ) {
    populationMetadata.forEach((population) => {
      const alias = population.type === 'relation' ? population.property : population.tableAlias || population.table;

      set(res, parentAlias ? `${parentAlias}.${population.property}` : population.property, alias);

      if (population.populates) {
        this.generatePopulateAliasMapper(res, population.populates, parentAlias ? `${parentAlias}.${alias}` : alias);
      }
    });

    return res;
  }

  baseFindOne(query: FindOneActionDto<Entity>, queryOptions?: QueryOptions) {
    const builder = this.createBuilder(query, queryOptions);

    return builder.getOne();
  }

  baseFindOneOrFail(query: FindOneActionDto<Entity>, queryOptions?: QueryOptions) {
    const builder = this.createBuilder(query, queryOptions);

    return builder.getOneOrFail();
  }

  baseFind(query: FindManyActionDto<Entity>, queryOptions?: QueryOptions) {
    const builder = this.createBuilder(query, queryOptions);

    return builder.getMany();
  }

  count(query: FindManyActionDto<Entity>, queryOptions?: QueryOptions) {
    const builder = this.createBuilder(query, queryOptions);

    return builder.getCount();
  }

  async baseList(query: FindManyActionDto<Entity>, queryOptions: QueryOptions = {}) {
    queryOptions.paginated = true;
    const builder = this.createBuilder(query, queryOptions);
    const [data, total] = await builder.getManyAndCount();

    return this.createPaginationBuilder<Entity>(data, total, query.pageSize, query.page);
  }

  baseCreate(createDto: CreateDto) {
    const entity = this.repository.create(createDto);

    return this.repository.save(entity);
  }

  baseBulkCreate({ entities }: { entities: CreateDto[] }) {
    return this.repository.save(this.repository.create(entities));
  }

  async baseUpdate(id: number | string, updateDto: UpdateDto) {
    const entity = await this.repository.findOneOrFail(id);

    return this.repository.save(merge(entity, updateDto) as Entity);
  }

  async baseUpdateOneOrFail(criteria: FindOneActionDto<Entity>, updateDto: UpdateDto) {
    const entity = await this.createBuilder(criteria).getOneOrFail();

    return this.repository.save(merge(entity, updateDto) as Entity);
  }

  async baseUpdateOne(criteria: FindOneActionDto<Entity>, updateDto: UpdateDto) {
    const entity = await this.createBuilder(criteria).getOne();

    return entity ? this.repository.save(merge(entity, updateDto) as Entity) : null;
  }

  async baseUpdateMany(criteria: FindOneActionDto<Entity>, dto: UpdateDto) {
    const entities = await this.createBuilder(criteria).getMany();

    return entities.length ? this.repository.save(entities.map((e) => merge(e, dto))) : null;
  }

  async baseDelete(id: number | string) {
    const entity = await this.repository.findOneOrFail(id);

    return this.repository.remove(entity);
  }

  async baseDeleteOne(criteria: FindOneActionDto<Entity>) {
    const entity = await this.createBuilder(criteria).getOne();

    return entity ? this.repository.remove(entity) : null;
  }

  async baseDeleteMany(criteria: FindOneActionDto<Entity>) {
    const entities = await this.createBuilder(criteria).getMany();

    return entities.length ? this.repository.remove(entities) : null;
  }

  async baseSoftDelete(id: number | string) {
    if (!this.entityHasDeleteColumn) {
      throw new Error('Be sure you declared DeleteDateColumn in schema');
    }

    const entity = await this.repository.findOneOrFail(id);

    return this.repository.softRemove(entity);
  }

  /*
   * Only update for given entity, not for relation entity
   */
  baseIncrement(conditions: FindCondition<Entity>, value: { [key in keyof Entity]?: number }) {
    if (!Object.entries(value)?.length) {
      throw new BadRequestException();
    }

    const setObj: QueryDeepPartialEntity<Entity> = {};

    Object.entries(value).forEach(([key, value]) => set(setObj, key, () => `${snakeCase(key)} + ${value}`));

    const builder = this.repository.createQueryBuilder(this.tableAlias);

    if (!this.populateAliasMapper) {
      this.setPopulateAliasMapper();
    }

    this.setConditions(builder, conditions, '', this.tableAlias, true);

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

  protected createBuilder(query: FindManyActionDto<Entity>, queryOptions: QueryOptions = {}) {
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

    if (!this.populateAliasMapper) {
      this.setPopulateAliasMapper();
    }

    this.setConditions(builder, query.where);

    if (query.search && isArrayNotEmpty(query.searchFields)) {
      this.setSearch(
        builder,
        query.search,
        query.searchFields,
        query.searchCriteria,
        queryOptions?.allowedSearchFields,
      );
    }

    if (queryOptions.includeDeleted && this.entityHasDeleteColumn) {
      builder.withDeleted();
    }

    if (isNotEmptyObject(query.sort)) {
      this.setSort(builder, query.sort);
    }

    if (queryOptions?.paginated) {
      let take = query.pageSize || DefaultPageSize;
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
    allowedPopulates: QueryPopulateOptions[],
  ) {
    const allow = this.getAllowedPopulation(allowedPopulates, this.populationMetadata);

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
      this.setJoin(populate, builder, this.tableAlias);
    });
  }

  setJoin(populate: any, builder: SelectQueryBuilder<Entity>, parentAlias) {
    let args;

    if (populate.method.endsWith('Select')) {
      args = [
        `${parentAlias}.${populate.table || populate.property}`,
        populate.tableAlias || populate.table || populate.property,
        populate.onConditions,
      ];
    } else {
      args = [
        `${parentAlias}.${populate.property}`,
        populate.table,
        populate.tableAlias || populate.table,
        populate.onConditions,
      ];
    }

    (builder as any)[populate.method](...args);

    if (populate.populates) {
      populate.populates.forEach((innerPopulate) => {
        this.setJoin(
          innerPopulate,
          builder,
          populate && !populate.method.endsWith('Select')
            ? populate.tableAlias || populate.table
            : populate.tableAlias || populate.property,
        );
      });
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

  protected getAllowedPopulation(queryPopulateOptions: QueryPopulateOptions[], source: any) {
    const allow: MergedPopulateOptions[] = [];

    if (!queryPopulateOptions) {
      if (source?.length) {
        return this.getAllowedPopulation(source, source);
      }

      return [];
    }

    if (!queryPopulateOptions.length) {
      return [];
    }

    queryPopulateOptions.forEach((queryOption) => {
      if (!queryOption) return;

      const match = source.find((servicePopulateOption) => servicePopulateOption.property === queryOption.property);

      let childPopulates;
      if (queryOption?.populates?.length || match?.populates?.length) {
        childPopulates = this.getAllowedPopulation(queryOption.populates, match.populates);
      }

      if (match) {
        allow.push({
          ...match,
          populates: childPopulates,
          required: hasOwnPropName(queryOption, 'required') ? queryOption.required : match.required,
          onConditions:
            queryOption.onConditions && queryOption.onConditions !== match.onConditions
              ? match.onConditions
                ? `${match.onConditions} AND (${queryOption.onConditions})`
                : queryOption.onConditions
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
    parentPath = '',
    parentField: string = this.tableAlias,
    needSnakeCase = false, // true for increment only
  ) {
    try {
      Object.entries(conditions).forEach(([field, value]) => {
        if (field === '$or') {
          return builder.andWhere(
            new Brackets((b) => this.setOrCondition(b, value, parentPath, parentField, needSnakeCase)),
          );
        }

        if (MapObjectOperator[field]) {
          const { str, params } = this.mapOperatorsToQuery(parentField, field, value);

          return builder.andWhere(str, params);
        }

        const cols = parentField.split('.');
        switch (cols.length) {
          case 1:
            parentField = parentField;
            break;
          default:
            parentField = cols[1];
        }

        if (needSnakeCase) field = snakeCase(field);

        if (isObject(value)) {
          if (this.populateAliasMapper[parentPath ? `${parentPath}.${field}` : field]) {
            field = this.populateAliasMapper[parentPath ? `${parentPath}.${field}` : field];
          }

          return this.setConditions(
            builder as unknown as SelectQueryBuilder<Entity>,
            value,
            parentPath ? `${parentPath}.${field}` : field,
            `${parentField}.${field}`,
          );
        }

        builder.andWhere(`${parentField}.${field} = (:${parentField}.${field})`, {
          [`${parentField}.${field}`]: value,
        });
      });
    } catch (error) {
      throw error;
    }
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
      case '$isNotNull':
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
    path: string,
    parentField: string,
    needSnakeCase?: boolean,
  ) {
    conditions.forEach((condition, index) =>
      builder[+index ? 'orWhere' : 'where'](
        new Brackets((b) => this.setConditions(b, condition, path, parentField, needSnakeCase)),
      ),
    );
  }

  protected setSearch(
    builder: SelectQueryBuilder<Entity>,
    search: string,
    searchFields: string[],
    searchCriteria: SearchType = SearchType.Contains,
    allowedSearchFields?: string[],
  ) {
    let searchValue = `%${search}%`;

    if (searchCriteria === SearchType.StartWith) searchValue = `${search}%`;
    if (searchCriteria === SearchType.EndWith) searchValue = `%${search}`;

    const fields = allowedSearchFields?.length ? intersection(searchFields, allowedSearchFields) : searchFields;

    if (!fields.length) {
      return;
    }

    builder.andWhere(
      new Brackets((b) => {
        fields.forEach((field, index) => {
          const fieldAlias = field.includes('.') ? field : `${this.tableAlias}.${field}`;
          return b[+index ? 'orWhere' : 'where'](
            `${fieldAlias} ${this.likeOperator} :searchValue`,
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
      return sorts.forEach(([field, order]) => {
        const alias = field.includes('.') ? field : `${this.tableAlias}.${field}`;

        return builder.addOrderBy(alias, order);
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

  checkNeedFindAgainByIds(query: FindManyActionDto<Entity>) {
    const { search, searchFields, where } = query;

    if (search && isArrayNotEmpty(searchFields)) {
      if (this.isSearchFieldsIncludesInnerProp(searchFields)) {
        return true;
      }
    }

    if (this.isWhereConditionsIncludesInnerProp(where)) {
      return true;
    }

    return false;
  }

  protected isWhereConditionsIncludesInnerProp(where: FindCondition<Entity>) {
    for (const v1 of Object.values(where)) {
      if (typeof v1 === 'object') {
        for (const v2 of Object.values(v1)) {
          // TECHNICAL DEBT: check when key1 = $or
          if (typeof v2 === 'string' && !MapObjectOperator[v2]) {
            return true;
          }
        }
      }
    }

    return false;
  }

  protected isSearchFieldsIncludesInnerProp(searchFields: string[]) {
    for (const field of searchFields) {
      if (field.includes('.')) {
        return true;
      }
    }
    return false;
  }
}
