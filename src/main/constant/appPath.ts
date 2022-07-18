import { app } from 'electron';
import { join, resolve } from 'path';

export const APP_ROOT_PATH = resolve(app.getAppPath(), '..');
export const STUDIO_BINARY_PATH = join(APP_ROOT_PATH, 'bin');
