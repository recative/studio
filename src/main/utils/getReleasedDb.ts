import { getDb } from '../rpc/db';
import { logToTerminal } from '../rpc/query/terminal';
import { extractDbBackupToTempPath } from './extractDbBackupToTempPath';

export const getReleasedDb = async (
  bundleReleaseId?: number,
  terminalId?: string
) => {
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

  if (terminalId) {
    logToTerminal(terminalId, `:: Getting archived release database`);
    logToTerminal(terminalId, `:: :: Bundle: b.${bundleReleaseId}`);
    logToTerminal(terminalId, `:: :: Media: m.${mediaBundleId}`);
  }

  return db1;
};
