import log from 'electron-log';

import { Writable, getMimeType } from '@recative/extension-sdk';

import { IResourceFile } from '@recative/definitions';
import { getDb } from '../db';
import { getResourceFilePath } from '../../utils/getResourceFile';

export const migration = async () => {
  const db = await getDb();

  const resources = db.resource.resources.find({
    type: 'file',
    mimeType: {
      $contains: 'video',
    },
  });

  log.log(':: Migrating resources', resources.length);

  for (let i = 0; i < resources.length; i += 1) {
    const resource = resources[i];

    if (resource.type !== 'file') {
      continue;
    }

    const newMime = await getMimeType(getResourceFilePath(resource));

    log.log(`:: :: ${resource.label} ${resource.mimeType} -> ${newMime}`);

    (resource as Writable<IResourceFile>).mimeType = newMime;
    db.resource.resources.update(resource);
  }
};
