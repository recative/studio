import { Zip, IBundleProfile } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/studio-definitions';

import { logToTerminal } from '../terminal';
import { getResourceListOfEpisode } from '../episode';

import { getReleasedDb } from '../../../utils/getReleasedDb';
import { getResourceFilePath } from '../../../utils/getResourceFile';
import { ifResourceIncludedInBundle } from '../../../dataGenerationProfiles/utils/ifResourceIncludedInBundle';

/**
 * Find all not-deleted resource files, which don't have any episode, or
 * have a property to cache to hard disk.
 * Copy them to the `assets/public/bundle/resource` directory of the
 * apk file.
 *
 * @param zip The archiver instance, this value could be null, which means
 *            we want a dry run.
 * @param mediaReleaseId release ID of media release.
 * @param terminalId Output information to which terminal.
 */
export const bundleMediaResources = async (
  zip: Zip | null,
  bundleReleaseId: number,
  mediaReleaseId: number,
  resourcePath: string,
  profile: IBundleProfile,
  terminalId: string
) => {
  const dbPromise = getReleasedDb(bundleReleaseId);
  const db = await dbPromise;

  const episodes = db.episode.episodes.data;
  const rawResources = await Promise.all(
    episodes.map(async ({ id: episodeId }) => {
      return getResourceListOfEpisode(
        episodeId,
        {
          type: 'bundleProfile',
          mediaReleaseId,
          codeReleaseId: -1,
          bundleProfile: profile,
        },
        dbPromise
      );
    })
  );

  const resourceList = rawResources
    .reduce((x, y) => [...x, ...y], [])
    .filter((x) => ifResourceIncludedInBundle(x, mediaReleaseId, profile));

  logToTerminal(terminalId, `Bundle media resources`, Level.Info);

  logToTerminal(terminalId, `:: Total: ${resourceList.length}`);

  logToTerminal(
    terminalId,
    `:: ${zip ? `Zip available` : `Zip not available`}`
  );

  if (!zip) {
    return resourceList;
  }

  logToTerminal(terminalId, `:: Parsing resources`);

  // Get file path of all resource files.
  const resourceFilePathList = await Promise.all(
    resourceList.map(async (resource) => {
      const result = {
        from: await getResourceFilePath(resource),
        to: `${resourcePath}/${resource.id}.resource`,
      };

      logToTerminal(terminalId, `:: :: Parsed ${resource.label}`);

      return result;
    })
  );

  await zip?.appendFileList(resourceFilePathList, true);

  return resourceList;
};
