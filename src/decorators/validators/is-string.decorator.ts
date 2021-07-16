import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString as IsStringOriginal,
  Matches,
  MaxLength,
  MinLength,
  ValidationOptions,
} from 'class-validator';

export const IsString = (
  options: {
    optional?: boolean;
    defaultValue?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    trim?: boolean;
    lowercase?: boolean;
  } = {},
  stringOptions?: ValidationOptions,
) => {
  const decorators = [];

  const { optional, defaultValue, minLength, maxLength, pattern, trim, lowercase } = Object.assign(
    { trim: true },
    options,
  );

  if (optional) {
    decorators.push(IsOptional());
  }
  decorators.push(
    Transform(({ value }) => {
      let v = String(value) || defaultValue;
      if (!v) {
        return v;
      }

      if (trim) {
        v = v.trim();
      }

      if (lowercase) {
        v = v.toLowerCase();
      }

      return v;
    }),
  );

  if (pattern) {
    decorators.push(Matches(pattern));
  }

  if (minLength) {
    decorators.push(MinLength(minLength));
  }

  if (maxLength) {
    decorators.push(MaxLength(maxLength));
  }

  return applyDecorators(...decorators, IsStringOriginal(stringOptions));
};
