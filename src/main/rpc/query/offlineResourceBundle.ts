import { join } from 'path';
import { flatten } from 'lodash';
import { ensureDir } from 'fs-extra';

import {
  languageResourceTags,
  TerminalMessageLevel as Level,
} from '@recative/definitions';

import { getBuildPath } from './setting';
import { logToTerminal } from './terminal';

import { getReleasedDb } from '../../utils/getReleasedDb';
import { getResourceFilePath } from '../../utils/getResourceFile';
import { createEmptyZip, archiverAppendPathList } from '../../utils/archiver';

/**
 * Create multiple zip tags for resources with different tags,
 * current rule is to create bundle for the combination of language,
 * and episodeId.
 *
 * @param mediaReleaseId release ID of media release.
 * @param bundleReleaseId Release ID of bundle release.
 * @param terminalId Output information to which terminal.
 */
export const createOfflineResourceBundle = async (
  bundleReleaseId: number,
  terminalId: string
) => {
  const db = await getReleasedDb(bundleReleaseId);
  const buildPath = await getBuildPath();

  const zipPath = join(
    buildPath,
    `offline-${bundleReleaseId.toString().padStart(4, '0')}`
  );

  ensureDir(zipPath);

  logToTerminal(terminalId, `Create resource zip for each episode`, Level.Info);

  const episodeList = db.episode.episodes.find({});

  const zips = flatten(
    episodeList.map(({ id: episodeId }) => {
      return languageResourceTags.map(({ id: languageTagId }) => {
        return {
          episodeId,
          languageTagId,
          filePath: join(
            zipPath,
            `package-${episodeId}-${languageTagId.replaceAll(':', '$')}.zip`
          ),
        };
      });
    })
  );

  return Promise.all(
    zips.map(async ({ episodeId, languageTagId, filePath }) => {
      const { archive, finished } = createEmptyZip(filePath);
      const resourceList = db.resource.resources.find({
        episodeIds: { $contains: episodeId },
        tags: { $contains: languageTagId },
      });

      const resourceFilePathList = resourceList.map((resource) => ({
        from: getResourceFilePath(resource),
        to: `${resource.id}.resource`,
      }));

      await archiverAppendPathList(archive, resourceFilePathList).promise;

      archive.finalize();

      await finished;
    })
  );
};
