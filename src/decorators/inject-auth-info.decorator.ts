import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
import { INJECT_AUTH_INFO } from 'src/common/constants';
import { isArrayNotEmpty } from 'src/common/packages/nestjs-crud-service/utils';
import { InjectAuthInfoInterceptor } from 'src/interceptors';

export interface InjectAuthInfoOptions {
  /*
   * property in req, which contain auth info (req[property])
   */
  property: string;

  /*
   * handler's name, which will add info from query function below to req.query.where
   */
  queryAction?: string[];

  /*
   * For example : { query: (user) => ({ userId: user.id, userName: user.name }) }
   */
  query?: (user: any) => any;

  /*
   * handler's name, which will add info from body function below to req.body
   */
  bodyAction?: string[];

  body?: (user: any) => any;
}

export const InjectAuthInfo = (options: InjectAuthInfoOptions) => (target: any) => {
  if (isArrayNotEmpty(options.queryAction) && !options.query) {
    throw new Error('Property query not found');
  }

  if (isArrayNotEmpty(options.bodyAction) && !options.body) {
    throw new Error('Property body not found');
  }

  Reflect.defineMetadata(INJECT_AUTH_INFO, options, target);
  Reflect.defineMetadata(INTERCEPTORS_METADATA, [InjectAuthInfoInterceptor], target);
};
