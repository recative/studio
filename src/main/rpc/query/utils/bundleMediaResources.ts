import { Zip, IBundleProfile } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/studio-definitions';

import { REDIRECT_URL_EXTENSION_ID } from '@recative/definitions';

import { logToTerminal } from '../terminal';

import { getReleasedDb } from '../../../utils/getReleasedDb';
import { getResourceFilePath } from '../../../utils/getResourceFile';
import { ifResourceIncludedInBundle } from '../../../dataGenerationProfiles/utils/ifResourceIncludedInBundle';
import { analysisPostProcessedRecords } from '../../../utils/analysisPostProcessedRecords';

/**
 * Find all not-deleted resource files, which don't have any episode, or
 * have a property to cache to hard disk.
 * Copy them to the `assets/public/bundle/resource` directory of the
 * apk file.
 *
 * @param zip The archiver instance.
 * @param mediaReleaseId release ID of media release.
 * @param terminalId Output information to which terminal.
 */
export const bundleMediaResources = async (
  zip: Zip,
  bundleReleaseId: number,
  mediaReleaseId: number,
  resourcePath: string,
  profile: IBundleProfile,
  terminalId: string
) => {
  const db = await getReleasedDb(bundleReleaseId);

  const resourceImported = db.resource.resources
    .find({
      type: 'file',
      removed: false,
      redirectTo: {
        $or: [{ $exists: false }, { $eq: false }],
      },
      url: {
        $nkeyin: [REDIRECT_URL_EXTENSION_ID],
      },
    })
    .filter((x) => ifResourceIncludedInBundle(x, mediaReleaseId, profile));
  const resourceProcessed = db.resource.postProcessed
    .find({
      type: 'file',
    })
    .filter((x) => ifResourceIncludedInBundle(x, mediaReleaseId, profile));

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

  await zip.appendFileList(resourceFilePathList, true);
};
