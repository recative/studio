import { join } from 'path';

import { LocalStorage } from 'node-localstorage';

import { HOME_DIR } from '../constant/configPath';

export const localStorage = new LocalStorage(join(HOME_DIR, 'confidential'));
