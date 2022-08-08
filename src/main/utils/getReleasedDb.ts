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

  const mediaBundleId = release.mediaBuildId;
  const dbPath = await extractDbBackupToTempPath(mediaBundleId);
  const db1 = getDb(dbPath, true, { mediaBundleId });

  return db1;
};
