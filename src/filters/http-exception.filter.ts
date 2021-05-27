import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req: Request = ctx.getRequest();
    const res: Response = ctx.getResponse();
    const statusCode = exception.getStatus();
    const exceptionResponse =
      typeof exception.getResponse() === 'string'
        ? {
            statusCode,
            message: exception.getResponse(),
            path: req.url,
          }
        : Object.assign(
            {
              statusCode,
              path: req.url,
            },
            exception.getResponse(),
          );

    res.status(statusCode).json(exceptionResponse);
  }
}
