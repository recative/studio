import { languageResourceTags } from '@recative/definitions';
import type {
  IBundleGroup,
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
} from '@recative/extension-sdk';
import type { IResourceFile, IResourceItem } from '@recative/definitions';

import { cleanupLoki } from './utils';
import { logToTerminal } from './terminal';

import { getDb } from '../db';

import { cloneDeep } from '../../utils/cloneDeep';
import { getResourceProcessorInstances } from '../../utils/getExtensionInstances';
import { getLokiCollectionFromMediaRelease } from '../../utils/getLokiCollectionFromMediaRelease';

export const postProcessResource = async (
  mediaReleaseId: number,
  terminalId: string,
  mediaDbReleaseId = mediaReleaseId
) => {
  const db = await getDb();

  logToTerminal(terminalId, `:: Initializing the post process pipeline`);
  const resourceCollection =
    await getLokiCollectionFromMediaRelease<IResourceItem>(
      mediaDbReleaseId,
      'resource',
      'resources'
    );

  // We need to extract both original resource files and post processed
  // files here.
  let resourceToBePostProcessed: PostProcessedResourceItemForUpload[] = [
    ...(
      resourceCollection.data.filter(
        (x) => x.type === 'file' && !x.removed
      ) as IResourceFile[]
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

  // Preprocessing the resources
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
  let updatedRecords = 0;
  let insertedRecord = 0;

  const postProcessedFiles = resourceToBePostProcessed.filter((resource) => {
    const postProcessed = !!resource.postProcessRecord.mediaBundleId.find(
      (x) => x === mediaReleaseId
    );

    return postProcessed;
  });

  postProcessedFiles.forEach((resource) => {
    const cleanResource = cleanupLoki(resource);
    const queriedResource = db.resource.postProcessed.findOne({
      id: cleanResource.id,
    });

    if (queriedResource) {
      // Update the record
      db.resource.postProcessed.update({
        ...queriedResource,
        ...cleanResource,
      });

      updatedRecords += 1;
    } else {
      db.resource.postProcessed.insert(cleanResource);
      insertedRecord += 1;
    }
  });

  logToTerminal(terminalId, `:: Final Report`);
  logToTerminal(terminalId, `:: :: Post processed:`);
  logToTerminal(terminalId, `:: :: :: Files: ${postProcessedFiles.length}`);
  logToTerminal(terminalId, `:: :: :: Updated: ${updatedRecords}`);
  logToTerminal(terminalId, `:: :: :: Inserted: ${insertedRecord}`);

  return resourceToBePostProcessed;
};
