import { lstat } from 'fs/promises';

export const isFile = async (x: string) => (await lstat(x)).isFile();
