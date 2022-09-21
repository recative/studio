import { join } from 'path';

import tempfile from 'tempfile';
import StreamZip from 'node-stream-zip';
import { ensureDir } from 'fs-extra';

import { getBuildPath } from '../rpc/query/setting';
import { logToTerminal } from '../rpc/query/terminal';

const cache = new Map<number, string>();

export const extractDbBackupToTempPath = async (
  mediaReleaseId: number,
  terminalId?: string
) => {
  if (cache.has(mediaReleaseId)) {
    logToTerminal(terminalId, ':: Database cache hit');
    return cache.get(mediaReleaseId);
  }

  logToTerminal(terminalId, ':: Database cache not hit');
  const dir = tempfile();
  ensureDir(dir);

  const buildPath = await getBuildPath();

  const dbBundlePath = join(
    buildPath,
    `db-${mediaReleaseId.toString().padStart(4, '0')}.zip`
  );

  logToTerminal(terminalId, `:: Bundle path: ${dbBundlePath}`);

  const zip = new StreamZip.async({ file: dbBundlePath });
  logToTerminal(terminalId, `:: Extracting Database`);

  const entries = await zip.entries();
  logToTerminal(
    terminalId,
    `:: :: Total entries: ${Object.keys(entries).length}`
  );

  await zip.extract(null, dir);
  logToTerminal(terminalId, `:: Closing the zip file`);
  await zip.close();

  logToTerminal(terminalId, `:: Finalizing`);
  cache.set(mediaReleaseId, dir);

  return dir;
};
