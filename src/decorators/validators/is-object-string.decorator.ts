import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsObject as IsObjectOriginal, IsOptional } from 'class-validator';

export const IsObjectString = ({ optional }: { optional?: boolean } = {}) => {
  const decorators = [];
  if (optional) {
    decorators.push(IsOptional());
  }

  decorators.push(
    Transform(({ value }) => {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }

      return value;
    }),
  );

  return applyDecorators(...decorators, IsObjectOriginal());
};
