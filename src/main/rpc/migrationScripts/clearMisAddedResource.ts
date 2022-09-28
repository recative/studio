import log from 'electron-log';

import { getDb } from '../db';

const FIND_WHAT = 'Recative Offline';

export const migration = async () => {
  const db = await getDb();

  const resources = db.resource.resources
    .find({})
    .filter((x) => x.label.startsWith(FIND_WHAT));

  log.log(':: Clean resources', resources.length);

  for (let i = 0; i < resources.length; i += 1) {
    const resource = resources[i];

    db.resource.resources.remove(resource);
  }

  log.log('finished');
};
