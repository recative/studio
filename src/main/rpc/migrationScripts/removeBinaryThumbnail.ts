import log from 'electron-log';

import { getDb } from '../db';

export const migration = async () => {
  const db = await getDb();

  db.resource.resources.data.forEach((x) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (x as any).postProcessedThumbnail;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (x as any).postProcessedFile;
  });

  log.log('finished');
};
