import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional } from 'class-validator';
import { IsEnum, IsNumber, IsObjectString, IsString } from 'src/decorators';
import { FindCondition } from '../interfaces/query-operator.interface';

export type SortOptions = { [index: string]: 'ASC' | 'DESC' };

export enum SearchType {
  Contains = 'Contains',
  StartWith = 'StartWith',
  EndWith = 'EndWith',
}

export class PopulateItemObject {
  property: string;

  // onConditions?: FindCondition<any>;

  populates?: PopulateItem[];
}

export type PopulateItem = string | PopulateItemObject;

export class FindOneActionDto<E> {
  @ApiProperty({ type: 'string' })
  @IsObjectString({ optional: true })
  where: FindCondition<E>;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    return typeof value === 'string' ? JSON.parse(value) : value;
  })
  populates?: PopulateItem[];

  @ApiPropertyOptional()
  @IsArray({})
  @IsOptional()
  @Transform(({ value }) => {
    return typeof value === 'string' ? JSON.parse(value) : value;
  })
  fields?: string[];

  @ApiPropertyOptional()
  @IsObjectString({ optional: true })
  sort?: SortOptions;

  @ApiPropertyOptional()
  @IsString({ optional: true })
  search?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  // TECHNICAL DEBT: make transform json string a decorator
  @Transform(({ value }) => {
    return typeof value === 'string' ? JSON.parse(value) : value;
  })
  searchFields?: string[];

  @ApiPropertyOptional({ enum: SearchType })
  @IsEnum({ entity: SearchType, defaultValue: SearchType.Contains })
  searchCriteria?: SearchType;
}

export class FindManyActionDto<E> extends FindOneActionDto<E> {
  @ApiPropertyOptional()
  @IsNumber({
    optional: true,
    positive: true,
    integer: true,
  })
  pageSize?: number;

  @ApiPropertyOptional()
  @IsNumber({
    optional: true,
    positive: true,
    integer: true,
  })
  page?: number;
}
