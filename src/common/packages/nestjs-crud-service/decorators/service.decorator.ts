/* eslint-disable prefer-rest-params */
import pSeries from 'p-series';
import { SERVICE_METADATA } from 'src/common/constants';
import { isArrayNotEmpty } from 'src/common/utils';
import { waterFallPromises } from '../utils';

interface ServiceMetadata {
  hooks?: { [methodName: string]: { before: string[]; after: string[] } };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const Service = () => (constructor: Function) => {
  const proto = constructor.prototype;
  const metadata = <ServiceMetadata>Reflect.getMetadata(SERVICE_METADATA, proto);

  if (metadata?.hooks) {
    Object.entries(metadata.hooks).map(([methodName, value]) => {
      const originalFunc = proto[methodName];

      if (!originalFunc) {
        throw new Error(`${methodName} not found`);
      }

      proto[methodName] = async function (this: any) {
        if (isArrayNotEmpty(value.before)) {
          await pSeries(value.before.map((fnName) => () => proto[fnName].apply(this, arguments)));
        }

        const response = await originalFunc.apply(this, arguments);

        if (!isArrayNotEmpty(value.after)) {
          return response;
        }

        return waterFallPromises(
          value.after.map((fnName) => (res) => proto[fnName].apply(this, [res, ...arguments])),
          response,
        );
      };
    });
  }
};
