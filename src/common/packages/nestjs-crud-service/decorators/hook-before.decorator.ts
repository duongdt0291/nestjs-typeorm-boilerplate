import { get, set } from 'lodash';
import { SERVICE_METADATA } from 'src/common/constants';

// eslint-disable-next-line @typescript-eslint/ban-types
export const Before =
  (...names: string[]) =>
  (target: any, methodName: string) => {
    const metadata = Reflect.getMetadata(SERVICE_METADATA, target) || {};

    names.forEach((name) => {
      const beforeMetadata = get(metadata, `hooks.${name}.before`, []);

      beforeMetadata.push(methodName);
      set(metadata, `hooks.${name}.before`, beforeMetadata);
    });

    Reflect.defineMetadata(SERVICE_METADATA, metadata, target);
  };
