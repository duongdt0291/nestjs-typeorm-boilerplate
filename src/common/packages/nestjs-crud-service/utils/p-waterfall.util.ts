export const waterFallPromises = (promises: any[], initParams?: any) => {
  return promises.reduce(
    (prev: any, curr: any) => prev.then((prevResult: any) => curr(prevResult)),
    Promise.resolve(initParams),
  );
};
