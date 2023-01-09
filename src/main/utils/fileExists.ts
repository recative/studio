import { access, constants } from 'fs';

export const fileExists = (path: string) =>
  new Promise((r) => {
    access(path, constants.F_OK, (e) => r(!e));
  });
