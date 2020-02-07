export const photosAuthorizationStatus = (): string =>
  global.YeetJSI?.photosAuthorizationStatus;

export const triggerScrollEvent = (nodeHandle: number) =>
  global.YeetJSI?.triggerScrollEvent(nodeHandle);

export const getItem = (key: string, type: string): any =>
  global.YeetJSI?.getItem(key, type);

export const removeItem = (key: string): any => global.YeetJSI?.removeItem(key);

export const setItem = (key: string, value: any, type: string): any =>
  global.YeetJSI?.setItem(key, value, type);
