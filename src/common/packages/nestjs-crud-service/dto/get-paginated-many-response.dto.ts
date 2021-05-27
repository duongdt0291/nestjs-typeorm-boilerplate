export class GetPaginatedManyDefaultResponse<T> {
  data: T[];
  count: number;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
