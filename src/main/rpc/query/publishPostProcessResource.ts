import { languageResourceTags } from '@recative/definitions';
import type {
  IBundleGroup,
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
} from '@recative/extension-sdk';
import type { IResourceFile } from '@recative/definitions';

import { cleanupLoki } from './utils';
import { logToTerminal } from './terminal';

import { getDb } from '../db';

import { cloneDeep } from '../../utils/cloneDeep';
import { getResourceProcessorInstances } from '../../utils/getExtensionInstances';

export const postProcessResource = async (
  mediaReleaseId: number,
  terminalId: string
) => {
  const db = await getDb();

  logToTerminal(terminalId, `:: Initializing the post process pipeline`);

  // We need to extract both original resource files and post processed
  // files here.
  let resourceToBePostProcessed: PostProcessedResourceItemForUpload[] = [
    ...(
      db.resource.resources.find({
        type: 'file',
        removed: false,
      }) as IResourceFile[]
    ).map((x) => {
      const clonedFile = cloneDeep(x) as IPostProcessedResourceFileForUpload;
      clonedFile.postProcessRecord = {
        mediaBundleId: [],
        operations: [],
      };
      return clonedFile;
    }),
    ...db.resource.postProcessed.find({}),
  ];

  const resourceProcessorInstances = Object.entries(
    await getResourceProcessorInstances(terminalId)
  );

  logToTerminal(
    terminalId,
    `:: ${resourceProcessorInstances.length} processor plugins enabled`
  );

  // Build bundle groups
  const episodeIdCombinations = new Set<string>();

  resourceToBePostProcessed.forEach((resource) => {
    if (!resource.episodeIds.length) return;
    episodeIdCombinations.add(resource.episodeIds.join(','));
  });

  const resourceBundleGroups: IBundleGroup[] = [];
  episodeIdCombinations.forEach((episode) => {
    const splitedEpisodes = episode.split(',').filter(Boolean);
    languageResourceTags.forEach((languageTag) => {
      resourceBundleGroups.push({
        tagContains: [languageTag.id],
        episodeIs: splitedEpisodes,
      });
    });

    resourceBundleGroups.push({
      tagNotContains: languageResourceTags.map((x) => x.id),
      episodeIs: splitedEpisodes,
    });
  });

  languageResourceTags.forEach((languageTag) => {
    resourceBundleGroups.push({
      tagContains: [languageTag.id],
      episodeIsEmpty: true,
    });
  });

  resourceBundleGroups.push({
    tagNotContains: languageResourceTags.map((x) => x.id),
    episodeIsEmpty: true,
  });

  logToTerminal(
    terminalId,
    `:: ${resourceBundleGroups.length} group of files will be packed`
  );

  // Postprocessing the resources
  for (let i = 0; i < resourceProcessorInstances.length; i += 1) {
    const [serviceProviderLabel, processor] = resourceProcessorInstances[i];

    logToTerminal(
      terminalId,
      `:: Postprocessing with ${serviceProviderLabel}!`
    );

    const processResult = await processor.beforePublishMediaBundle(
      resourceToBePostProcessed,
      mediaReleaseId,
      resourceBundleGroups
    );

    if (processResult) {
      resourceToBePostProcessed = processResult;
    }
  }

  // Filter out all resource that post processed for this build, add it to the
  // post processed cache table, for clients to read.
  const postProcessedFiles = resourceToBePostProcessed.filter((resource) => {
    const postProcessed = !!resource.postProcessRecord.mediaBundleId.find(
      (x) => x === mediaReleaseId
    );

    return postProcessed;
  });

  let updateCount = 0;
  let insertCount = 0;

  postProcessedFiles.forEach((resource) => {
    const newRecord = cleanupLoki(resource);
    const oldRecord = db.resource.postProcessed.findOne({
      id: newRecord.id,
    });

    if (
      oldRecord &&
      // There maybe a bug of Loki.js I think, it is queried from findOne but
      // can not be queried from get
      db.resource.postProcessed.get(oldRecord.$loki, true) !== null
    ) {
      db.resource.postProcessed.update({ ...oldRecord, ...newRecord });
      updateCount += 1;
    } else {
      db.resource.postProcessed.insert(newRecord);
      insertCount += 1;
    }
  });

  db.resource.$db.collections.forEach((x) => {
    x.dirty = true;
  });

  logToTerminal(terminalId, `:: Finalizing resource database`);
  logToTerminal(
    terminalId,
    `:: :: Dirty tables ${
      db.resource.$db.collections.filter((x) => x.dirty).length
    }`
  );

  await new Promise<void>((resolve, reject) => {
    db.resource.$db.saveDatabase((error) => {
      if (error) return reject(error);
      logToTerminal(terminalId, `:: :: Saved to ${db.resource.$db.filename}`);
      return resolve();
    });
  });

  logToTerminal(terminalId, `:: Final Report`);
  logToTerminal(terminalId, `:: :: Post processed:`);
  logToTerminal(terminalId, `:: :: :: Files: ${postProcessedFiles.length}`);
  logToTerminal(terminalId, `:: :: :: Updated: ${updateCount}`);
  logToTerminal(terminalId, `:: :: :: Inserted: ${insertCount}`);

  return resourceToBePostProcessed;
};
