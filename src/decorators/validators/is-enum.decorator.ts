import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEnum as IsEnumOriginal, IsOptional, ValidationOptions } from 'class-validator';

export const IsEnum = (
  {
    defaultValue,
    entity,
  }: {
    entity: any;
    defaultValue?: string;
  },
  options?: ValidationOptions,
) => {
  const decorators = [];

  if (defaultValue) {
    decorators.push(IsOptional());
  }

  decorators.push(
    Transform(({ value }) => {
      return value || defaultValue;
    }),
  );

  return applyDecorators(...decorators, IsEnumOriginal(entity, options));
};
