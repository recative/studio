import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

export const require = createRequire(import.meta.url);
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
