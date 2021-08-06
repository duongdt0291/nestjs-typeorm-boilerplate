import { ApiProperty } from '@nestjs/swagger';

export class GetPaginatedManyDefaultResponse<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  count: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  pageCount: number;
}
