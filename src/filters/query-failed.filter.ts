import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { STATUS_CODES } from 'http';
import { QueryFailedError } from 'typeorm';
import { ConstraintErrors } from './constraint-errors';

@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = getStatus(exception);
    const errorMessage = exception?.detail?.includes('is still referenced')
      ? ConstraintErrors[`${exception.constraint}_RESTRICTED_DELETE`]
      : ConstraintErrors[`${exception.constraint}`] || `${exception.constraint}`;

    response.status(status).json({
      statusCode: status,
      error: STATUS_CODES[status],
      message: errorMessage,
    });
  }
}

const getStatus = (exception: { constraint: string; detail: string }) => {
  if (exception?.constraint?.startsWith('UQ')) {
    return HttpStatus.CONFLICT;
  }

  if (exception?.constraint?.startsWith('FK')) {
    if (exception.detail.includes('is not present in table')) return HttpStatus.NOT_FOUND;

    return HttpStatus.UNPROCESSABLE_ENTITY;
  }

  return HttpStatus.INTERNAL_SERVER_ERROR;
};
