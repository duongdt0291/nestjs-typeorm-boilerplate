export const objKeys = (val: any): string[] => Object.keys(val);

export const getOwnPropNames = (val: any): string[] => Object.getOwnPropertyNames(val);

export const hasOwnPropName = (val: any, propName: string) => Object.getOwnPropertyNames(val).includes(propName);
