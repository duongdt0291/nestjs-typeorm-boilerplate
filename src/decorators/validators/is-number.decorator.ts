import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNegative,
  IsNotEmpty,
  IsNumber as IsNumberOriginal,
  IsNumberOptions,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { isNumber } from 'lodash';
import { isArrayNotEmpty } from 'src/common/packages/nestjs-crud-service/utils';
import { IsGreaterThan } from './is-greater-than.decorator';

export const IsNumber = (
  {
    optional,
    defaultValue,
    min,
    max,
    positive,
    negative,
    integer,
    notEmpty,
    greaterThan,
  }: {
    optional?: boolean;
    defaultValue?: number;
    min?: number;
    max?: number;
    positive?: boolean;
    negative?: boolean;
    integer?: boolean;
    notEmpty?: boolean;
    greaterThan?: string[];
  },
  numberOptions?: IsNumberOptions,
) => {
  const decorators = [];

  if (isArrayNotEmpty(greaterThan)) {
    greaterThan.forEach((f) => decorators.push(IsGreaterThan(f)));
  }

  if (min) {
    decorators.push(Min(min));
  }

  if (max) {
    decorators.push(Max(max));
  }

  if (positive) {
    decorators.push(IsPositive());
  }

  if (negative) {
    decorators.push(IsNegative());
  }

  if (integer) {
    decorators.push(IsInt());
  }

  decorators.push(IsNumberOriginal(numberOptions));

  if (optional || isNumber(defaultValue)) {
    decorators.push(IsOptional());
  }

  if (notEmpty) {
    decorators.push(IsNotEmpty());
  }

  decorators.push(
    Transform(({ value }) => {
      if (value) {
        return +value;
      }
      return defaultValue ? defaultValue : value;
    }),
  );

  return applyDecorators(...decorators);
};
