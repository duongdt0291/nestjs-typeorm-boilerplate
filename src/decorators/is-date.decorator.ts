import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsDate as IsDateOriginal, IsOptional, ValidationOptions } from 'class-validator';

export const IsDate = (
  {
    optional,
    convert,
  }: {
    optional?: boolean;
    convert?: boolean;
  },
  options?: ValidationOptions,
) => {
  const decorators = [];
  if (optional) {
    decorators.push(IsOptional());
  }

  return applyDecorators(
    ...decorators,
    Transform(({ value }) => {
      return convert ? new Date(value) : value;
    }),
    IsDateOriginal(options),
  );
};
