import { inspect } from 'util';

export const logInspect = (x: unknown) => {
  console.log(console.log(inspect(x, false, null, true /* enable colors */)));
};
