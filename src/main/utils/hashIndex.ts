import { h32 } from 'xxhashjs';

const SEED = 0x7b701cfee4c20000;

/**
 * Convert a index to hashed value.
 * @param x String to be hashed.
 */
export const hashIndex = (x: string) => h32(x, SEED).toNumber();
