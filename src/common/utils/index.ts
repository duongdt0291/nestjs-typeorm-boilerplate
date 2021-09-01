export const isArrayNotEmpty = (arr) => Array.isArray(arr) && arr.length;

export const getFileExt = (fileName: string) => fileName.split('.').pop();

export const getFileNameWithoutExt = (fileName: string) => fileName.slice(-(getFileExt(fileName) + 1));

// https://stackoverflow.com/questions/25538860/extracting-hashtags-out-of-a-string
export const getHashtagsFromStr = (str: string) => str.match(/#[\p{L}]+/giu) || [];

export * from './color.util';
