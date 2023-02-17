/* eslint-disable no-console */
import { inspect } from 'util';

export const logInspect = (x: unknown) => {
  console.log(inspect(x, false, null, true /* enable colors */));
};
