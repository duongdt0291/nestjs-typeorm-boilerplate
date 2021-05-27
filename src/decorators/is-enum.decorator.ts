import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEnum as IsEnumOriginal, ValidationOptions } from 'class-validator';

export const IsEnum = (
  {
    defaultValue,
    entity,
  }: {
    entity: any;
    defaultValue?: string;
  },
  options?: ValidationOptions,
) =>
  applyDecorators(
    Transform(({ value }) => {
      return value || defaultValue;
    }),
    IsEnumOriginal(entity, options),
  );
