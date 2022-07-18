import { join } from 'path';

import tempfile from 'tempfile';
import StreamZip from 'node-stream-zip';
import { ensureDir } from 'fs-extra';

import { getBuildPath } from '../rpc/query/setting';

export const extractDbBackupToTempPath = async (mediaReleaseId: number) => {
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

  return dir;
};
