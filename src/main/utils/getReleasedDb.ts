import { getDb } from '../rpc/db';
import { extractDbBackupToTempPath } from './extractDbBackupToTempPath';

export const getReleasedDb = async (bundleReleaseId?: number) => {
  const db0 = await getDb();

  if (!bundleReleaseId) {
    return db0;
  }

  const release = db0.release.bundleReleases.findOne({ id: bundleReleaseId });

  if (!release) {
    throw new TypeError(`Release not found: ${bundleReleaseId}`);
  }

  const mediaReleaseId = release.mediaBuildId;
  const dbPath = await extractDbBackupToTempPath(mediaReleaseId);
  const db1 = getDb(dbPath, true);

  return db1;
};
