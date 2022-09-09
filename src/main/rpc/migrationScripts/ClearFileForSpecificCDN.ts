import log from 'electron-log';

import { getDb } from '../db';

const FIND_WHAT = '';
const REPLACE_TO_WHAT = '';

export const migration = async () => {
  const db = await getDb();

  const resources = db.resource.resources.find({
    type: 'file',
  });

  log.log(':: Migrating resources', resources.length);

  for (let i = 0; i < resources.length; i += 1) {
    const resource = resources[i];

    if (resource.type !== 'file') {
      continue;
    }

    const urlEntries = Object.entries(resource.url);

    for (let j = 0; j < urlEntries.length; j += 1) {
      const [key, value] = urlEntries[j];
      resource.url[key] = value.replace(FIND_WHAT, REPLACE_TO_WHAT);
    }

    db.resource.resources.update(resource);
  }

  const pResources = db.resource.postProcessed.find({
    type: 'file',
  });

  for (let i = 0; i < pResources.length; i += 1) {
    const resource = pResources[i];

    if (resource.type !== 'file') {
      continue;
    }

    const urlEntries = Object.entries(resource.url);

    for (let j = 0; j < urlEntries.length; j += 1) {
      const [key, value] = urlEntries[j];
      resource.url[key] = value.replace(FIND_WHAT, REPLACE_TO_WHAT);
    }

    db.resource.postProcessed.update(resource);
  }
};
