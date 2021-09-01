import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  ArrayUniqueIdentifier,
  IsArray as IsArrayOriginal,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  ValidationOptions,
} from 'class-validator';
import { isArrayNotEmpty } from 'src/common/packages/nestjs-crud-service/utils';

export const IsArray = (
  {
    optional,
    notEmpty,
    minSize,
    maxSize,
    unique,
    nestedValidate,
    nestedType,
  }: {
    optional?: boolean;
    notEmpty?: boolean;
    minSize?: number;
    maxSize?: number;
    unique?: ArrayUniqueIdentifier[];
    nestedValidate?: boolean;
    nestedType?: any;
  },
  options?: ValidationOptions,
) => {
  const decorators = [];

  if (notEmpty) {
    decorators.push(IsNotEmpty());
  }

  if (minSize) {
    decorators.push(ArrayMinSize(minSize));
  }

  if (maxSize) {
    decorators.push(ArrayMaxSize(maxSize));
  }

  if (isArrayNotEmpty(unique)) {
    unique.forEach((fn) => decorators.push(ArrayUnique(fn)));
  }

  if (nestedValidate) {
    decorators.push(ValidateNested({ each: true }));

    if (nestedType) {
      decorators.push(Type(() => nestedType));
    }
  }

  if (optional) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators, IsArrayOriginal(options));
};
