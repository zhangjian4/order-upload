export const sleep = (time: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, time);
  });

export const withTimeout = (promise: Promise<any>, timeout: number) =>
  new Promise<any>((resolve, reject) => {
    promise.then((result) => resolve(result));
    promise.catch((error) => reject(error));
    const t = setTimeout(() => reject('timeout:' + timeout + 'ms'), timeout);
    promise.finally(() => clearTimeout(t));
  });
