// type QueryFields = string[];

export interface QueryOptions {
  /*
   * Allow Populates
   * Default: All population, declared in service
   */
  population?: QueryPopulateOptions[];

  /*
   * Max limit record
   */
  maxLimit?: number;

  /*
   * Fields, allow to use in searchField
   */
  allowedSearchFields?: string[];

  /*
   * Return soft-deleted record
   */
  includeDeleted?: boolean;

  /*
   * explicit select hidden fields, which has @Column options select: false in entity
   */
  includeHiddenFields?: string[];

  /*
   * Explicit required pagination for find method
   */
  paginated?: boolean;
}

export interface QueryPopulateOptions {
  /*
   * Field, which declare in entity with relation or for map property
   */
  property?: string;

  /*
   * Always join when query
   */
  eager?: boolean;

  /*
   * When true, use innerJoin
   * else leftJoin
   */
  required?: boolean;

  /*
   * On conditions
   * It will add with onConditions, which declared in service
   */
  onConditions?: string;

  /*
   * Child Populations
   */
  populates?: QueryPopulateOptions[];
}
