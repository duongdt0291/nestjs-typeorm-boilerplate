import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { STATUS_CODES } from 'http';
import { EntityNotFoundError } from 'typeorm';

@Catch(EntityNotFoundError)
export class EntityNotFoundFilter implements ExceptionFilter {
  catch(exception: EntityNotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errorMessage = `${getEntityFromErrorMessage(exception.message)} NOT FOUND`;
    const status = HttpStatus.NOT_FOUND;

    response.status(status).json({
      statusCode: status,
      error: STATUS_CODES[status],
      message: errorMessage,
    });
  }
}

const getEntityFromErrorMessage = (msg: string) => {
  return msg.split('"')[1].toUpperCase();
};
