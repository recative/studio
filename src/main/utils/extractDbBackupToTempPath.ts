import { join } from 'path';

import tempfile from 'tempfile';
import StreamZip from 'node-stream-zip';
import { ensureDir } from 'fs-extra';

import { getBuildPath } from '../rpc/query/setting';

const cache = new Map<number, string>();

export const extractDbBackupToTempPath = async (mediaReleaseId: number) => {
  if (cache.has(mediaReleaseId)) {
    return cache.get(mediaReleaseId);
  }

  const dir = tempfile();
  ensureDir(dir);

  const buildPath = await getBuildPath();

  const dbBundlePath = join(
    buildPath,
    `db-${mediaReleaseId.toString().padStart(4, '0')}.zip`
  );

  const zip = new StreamZip.async({ file: dbBundlePath });

  await zip.extract(null, dir);
  await zip.close();

  cache.set(mediaReleaseId, dir);

  return dir;
};
