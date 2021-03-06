import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { INJECT_AUTH_INFO } from 'src/common/constants';
import { InjectAuthInfoOptions } from 'src/decorators';

export class InjectAuthInfoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const ctrl = context.getClass();
    const handler = context.getHandler();
    const options = <InjectAuthInfoOptions>Reflect.getMetadata(INJECT_AUTH_INFO, ctrl);

    if (options.queryAction && options.queryAction.includes(handler.name)) {
      if (!req.query?.where) {
        req.query.where = {};
      } else if (typeof req.query?.where === 'string') {
        req.query.where = JSON.parse(req.query.where);
      }

      Object.assign(req.query.where, options.query(req[options.property]));
    } else if (options.bodyAction && options.bodyAction.includes(handler.name)) {
      Object.assign(req.body, options.body(req[options.property]));
    }

    return next.handle();
  }
}
