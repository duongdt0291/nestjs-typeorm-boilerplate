import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNegative,
  IsNumber as IsNumberOriginal,
  IsNumberOptions,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

export const IsNumber = (
  {
    optional,
    defaultValue,
    min,
    max,
    positive,
    negative,
    integer,
  }: {
    optional?: boolean;
    defaultValue?: number;
    min?: number;
    max?: number;
    positive?: boolean;
    negative?: boolean;
    integer?: boolean;
  } = {},
  numberOptions?: IsNumberOptions,
) => {
  const decorators = [];
  if (optional) {
    decorators.push(IsOptional());
  }

  decorators.push(
    Transform(({ value }) => {
      if (value) {
        return +value;
      }
      return defaultValue ? defaultValue : value;
    }),
  );

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

  return applyDecorators(...decorators, IsNumberOriginal(numberOptions));
};
