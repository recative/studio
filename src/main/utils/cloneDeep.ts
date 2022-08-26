import copy from 'fast-copy';

export const cloneDeep = <T>(x: T) => {
  return copy(x);
};
