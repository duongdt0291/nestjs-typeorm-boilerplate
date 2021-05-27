export interface QueryOperator<T> {
  $eq?: T;
  $ne?: T;
  $not?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $between?: T[];
  $notBetween?: T[];
  $in?: T[];
  $nin?: T[];
  $starts?: string; // = LIKE abc%
  $cont?: string; // = LIKE %abc%
  $ends?: string; // = LIKE %abc
  $notLike?: string; // = NOT LIKE
  $isNull?: boolean;
  $isNotNull?: boolean;
  $or?: T;
  $field?: {
    operator: string;
    field: string;
  };
}

type PrimitiveTypes = number | boolean | string | Date;
type SpecialObjectTypes = Date;

export type FindCondition<E> = {
  [K in keyof E]?: E[K] extends (infer U)[] // giá trị là 1 mảng
    ? U extends PrimitiveTypes
      ? U[] | QueryOperator<U>
      : FindCondition<U>
    : E[K] extends SpecialObjectTypes
    ?
        | {
            [O in keyof QueryOperator<E[K]>]?: QueryOperator<E[K]>[O] | QueryOperator<string>[O];
          }
        | E[K]
        | string
    : E[K] extends Record<string, unknown>
    ? FindCondition<E[K]>
    : E[K] extends PrimitiveTypes
    ? E[K] | QueryOperator<E[K]>
    : { [O in keyof QueryOperator<E[K]>]?: QueryOperator<E[K]>[O] } | FindCondition<E[K]>;
} & { $or?: FindCondition<E>[] };
