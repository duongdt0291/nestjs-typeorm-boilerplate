import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsObject, IsOptional, IsPositive, IsString } from 'class-validator';
import { FindCondition } from '../interfaces/query-operator.interface';

export type SortOptions = { [index: string]: 'ASC' | 'DESC' };

export enum SearchType {
  Contains = 'Contains',
  StartWith = 'StartWith',
  EndWith = 'EndWith',
}

export class PopulateItemObject {
  name: string;

  // onConditions?: FindCondition<any>;

  populates?: PopulateItem[];
}

export type PopulateItem = string | PopulateItemObject;

export class FindOneActionDto<E> {
  @ApiProperty()
  @IsObject()
  where: FindCondition<E>;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  populates?: PopulateItem[];

  @ApiPropertyOptional()
  @IsArray({})
  @IsOptional()
  fields?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  sort?: SortOptions;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  searchFields?: string[];

  @ApiPropertyOptional({ enum: SearchType })
  @IsEnum(SearchType)
  @IsOptional()
  searchCriteria?: SearchType = SearchType.Contains;
}

export class FindManyActionDto<E> extends FindOneActionDto<E> {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsPositive()
  pageSize?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @IsPositive()
  page?: number;
}
