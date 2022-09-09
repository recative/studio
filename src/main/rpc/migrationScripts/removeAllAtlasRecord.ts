import log from 'electron-log';

import { getDb } from '../db';

export const migration = async () => {
  const db = await getDb();

  const resources = db.resource.postProcessed
    .find()
    .filter((x) =>
      x.postProcessRecord.operations.find(
        (y) =>
          y.extensionId ===
          '@recative/extension-rs-atlas/AtlasResourceProcessor'
      )
    );

  log.log(':: Migrating resources', resources.length);

  for (let i = 0; i < resources.length; i += 1) {
    console.log(`Removed ${resources[i].id}`);
    db.resource.postProcessed.remove(resources[i]);
  }
};
