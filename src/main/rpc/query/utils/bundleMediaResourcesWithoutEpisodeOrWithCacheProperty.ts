import type { Archiver } from 'archiver';

import {
  REDIRECT_URL_EXTENSION_ID,
  TerminalMessageLevel as Level,
} from '@recative/definitions';

import { logToTerminal } from '../terminal';

import { getReleasedDb } from '../../../utils/getReleasedDb';
import { getResourceFilePath } from '../../../utils/getResourceFile';
import { archiverAppendPathList } from '../../../utils/archiver';
import { analysisPostProcessedRecords } from '../../../utils/analysisPostProcessedRecords';

import { MOBILE_SHELL_BUILD_IN_KEY } from '../../../utils/buildInResourceUploaderKeys';

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
  mediaReleaseId: number,
  resourcePath: string,
  terminalId: string
) => {
  const db = await getReleasedDb(bundleReleaseId);

  // Get all resource that is not removed and have no episode record.
  const resourceImported = db.resource.resources.find({
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
    redirectTo: {
      $or: [{ $exists: false }, { $eq: false }],
    },
    url: {
      $nkeyin: [REDIRECT_URL_EXTENSION_ID],
    },
  });
  const resourceProcessed = db.resource.postProcessed
    .find({
      type: 'file',
      $or: [
        {
          episodeIds: { $size: 0 },
        },
        {
          cacheToHardDisk: true,
        },
      ],
      mimeType: {
        $ne: 'application/zip',
      },
    })
    .filter((x) => x.postProcessRecord.mediaBundleId.includes(mediaReleaseId));

  const postProcessCombination =
    analysisPostProcessedRecords(resourceProcessed);

  logToTerminal(terminalId, `:: Build in media bundler:`);
  logToTerminal(terminalId, `:: :: Imported: ${resourceImported.length}`);
  logToTerminal(terminalId, `:: :: Processed: ${resourceProcessed.length}`);

  postProcessCombination.forEach((value, key) => {
    logToTerminal(terminalId, `:: :: :: ${key}: ${value}`);
  });

  logToTerminal(
    terminalId,
    `:: :: Total: ${resourceImported.length + resourceProcessed.length}`
  );

  const withBuildInResourceImported = resourceImported.filter((resource) => {
    return (
      resource.type === 'file' && MOBILE_SHELL_BUILD_IN_KEY in resource.url
    );
  });

  const withBuildInResourcePostProcessed = resourceImported.filter(
    (resource) => {
      return (
        resource.type === 'file' && MOBILE_SHELL_BUILD_IN_KEY in resource.url
      );
    }
  );

  logToTerminal(terminalId, `:: With build-in url:`);
  logToTerminal(
    terminalId,
    `:: :: Imported: ${withBuildInResourceImported.length}`
  );
  logToTerminal(
    terminalId,
    `:: :: Processed: ${withBuildInResourcePostProcessed.length}`
  );
  logToTerminal(
    terminalId,
    `:: :: Total: ${
      withBuildInResourceImported.length +
      withBuildInResourcePostProcessed.length
    }`
  );

  const resourceList = [...resourceImported, ...resourceProcessed];

  logToTerminal(
    terminalId,
    `Bundle media resources without episode`,
    Level.Info
  );

  logToTerminal(terminalId, `:: Total: ${resourceList.length}`);
  logToTerminal(terminalId, `:: :: Imported: ${resourceImported.length}`);
  logToTerminal(terminalId, `:: :: Processed: ${resourceProcessed.length}`);

  // Get file path of all resource files.
  const resourceFilePathList = resourceList.map((resource) => ({
    from: getResourceFilePath(resource),
    to: `${resourcePath}/${resource.id}.resource`,
  }));

  await archiverAppendPathList(archive, resourceFilePathList).promise;
};
