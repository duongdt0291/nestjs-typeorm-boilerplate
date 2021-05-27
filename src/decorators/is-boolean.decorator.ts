import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean as IsBooleanOriginal, ValidationOptions } from 'class-validator';

export const IsBoolean = (
  {
    convert,
    defaultValue,
  }: {
    convert: boolean;
    defaultValue?: string;
  },
  options?: ValidationOptions,
) =>
  applyDecorators(
    Transform(({ value }) => {
      let v = value || defaultValue;
      if (convert) {
        v = Boolean(v);
      }

      return v;
    }),
    IsBooleanOriginal(options),
  );
