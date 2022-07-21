import type { Archiver } from 'archiver';

import { TerminalMessageLevel as Level } from '@recative/definitions';

import { getReleasedDb } from 'utils/getReleasedDb';
import { logToTerminal } from '../terminal';

import { getResourceFilePath } from '../../../utils/getResourceFile';
import { archiverAppendPathList } from '../../../utils/archiver';

/**
 * Find all not-deleted resource files, which don't have any episode, or
 * have a property to cache to hard disk.
 * Copy them to the `assets/public/bundle/resource` directory of the
 * apk file.
 *
 * @param archive The archiver instance.
 * @param mediaReleaseId release ID of media release.
 * @param terminalId Output information to which terminal.
 */
export const bundleMediaResourcesWithoutEpisodeOrWithCacheProperty = async (
  archive: Archiver,
  bundleReleaseId: number,
  resourcePath: string,
  terminalId: string
) => {
  const db = await getReleasedDb(bundleReleaseId);

  // Get all resource that is not removed and have no episode record.
  const resourceList = db.resource.resources.find({
    type: 'file',
    removed: false,
    $or: [
      {
        episodeIds: { $size: 0 },
      },
      {
        cacheToHardDisk: true,
      },
    ],
  });

  logToTerminal(
    terminalId,
    `Bundle media resources without episode`,
    Level.Info
  );

  // Get file path of all resource files.
  const resourceFilePathList = resourceList.map((resource) => ({
    from: getResourceFilePath(resource),
    to: `${resourcePath}/${resource.id}`,
  }));

  logToTerminal(
    terminalId,
    `${resourceFilePathList.length} files found`,
    Level.Info
  );

  await archiverAppendPathList(archive, resourceFilePathList).promise;
};
