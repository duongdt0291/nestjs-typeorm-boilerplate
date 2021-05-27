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
  {
    optional,
    defaultValue,
    minLength,
    maxLength,
    pattern,
    trim,
    lowercase,
  }: {
    optional?: boolean;
    defaultValue?: string;

    minLength?: number;
    maxLength?: number;

    pattern?: string;

    trim?: boolean;
    lowercase?: boolean;
  },
  options?: ValidationOptions,
) => {
  const decorators = [];
  if (optional) {
    decorators.push(IsOptional());
  }
  decorators.push(
    Transform(({ value }) => {
      const v = String(value) || defaultValue;
      if (!v) {
        return v;
      }

      if (trim) {
        v.trim();
      }

      if (lowercase) {
        v.toLowerCase();
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

  return applyDecorators(...decorators, IsStringOriginal(options));
};
