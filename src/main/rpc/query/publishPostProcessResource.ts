/* eslint-disable no-await-in-loop */
import { cloneDeep } from 'lodash';

import {
  languageResourceTags,
  TerminalMessageLevel,
} from '@recative/definitions';
import type {
  IBundleGroup,
  IResourceFile,
  IResourceItem,
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
} from '@recative/definitions';

import { cleanupLoki } from './utils';
import { logToTerminal } from './terminal';

import { getDb } from '../db';

import { getResourceProcessorInstances } from '../../utils/getExtensionInstances';
import { getLokiCollectionFromMediaRelease } from '../../utils/getLokiCollectionFromMediaRelease';

export const postProcessResource = async (
  mediaReleaseId: number,
  terminalId: string
) => {
  const db = await getDb();

  logToTerminal(terminalId, `:: Initializing the post process pipeline`);
  const resourceCollection =
    await getLokiCollectionFromMediaRelease<IResourceItem>(
      mediaReleaseId,
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
    await getResourceProcessorInstances()
  );

  logToTerminal(
    terminalId,
    `:: ${resourceProcessorInstances.length} processor plugins enabled`
  );

  // Build bundle groups
  const episodeIdCombinations = new Set<string>();

  resourceToBePostProcessed.forEach((resource) => {
    episodeIdCombinations.add(resource.episodeIds.join(','));
  });

  const resourceBundleGroups: IBundleGroup[] = [];
  episodeIdCombinations.forEach((episode) => {
    const splitedEpisodes = episode.split(',').filter(Boolean);
    languageResourceTags.forEach((languageTag) => {
      resourceBundleGroups.push({
        tagContains: [languageTag.id],
        episodeContains: splitedEpisodes,
      });
    });

    resourceBundleGroups.push({
      tagNotContains: languageResourceTags.map((x) => x.id),
      episodeContains: splitedEpisodes,
    });
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

    processor.dependency.logToTerminal = (
      message: string,
      logLevel: TerminalMessageLevel
    ) => {
      logToTerminal(terminalId, message, logLevel);
    };

    resourceToBePostProcessed = await processor.beforePublishMediaBundle(
      resourceToBePostProcessed,
      mediaReleaseId,
      resourceBundleGroups
    );
  }

  // Filter out all resource that post processed for this build, add it to the
  // post processed cache table, for clients to read.
  const postProcessedFiles = resourceToBePostProcessed.filter((resource) => {
    const postProcessed = !!resource.postProcessRecord.mediaBundleId.find(
      (x) => x === mediaReleaseId
    );

    return postProcessed;
  });

  logToTerminal(
    terminalId,
    `:: ${postProcessedFiles.length} post processed file generated`
  );

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
    } else {
      db.resource.postProcessed.insert(cleanResource);
    }
  });

  return resourceToBePostProcessed;
};
