/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import { join } from 'path';
import { readFile } from 'fs/promises';

import { Category } from '@recative/definitions';
import { TerminalMessageLevel as Level } from '@recative/extension-sdk';
import type { IResourceFile, IResourceItem } from '@recative/definitions';
import type { PostProcessedResourceItemForUpload } from '@recative/extension-sdk';

import { getSeriesId } from './series';
import { logToTerminal } from './terminal';

import { getDb } from '../db';

import { PromiseQueue } from '../../utils/PromiseQueue';
import { getReleasedDb } from '../../utils/getReleasedDb';
import { getResourceFilePath } from '../../utils/getResourceFile';
import { getUploaderInstances } from '../../utils/getResourceProcessorInstances';

/**
 * Deploy media bundle to remote server.
 * @param mediaReleaseId release ID of media release.
 * @param terminalId Output information to which terminal.
 */
export const uploadMediaBundle = async (
  mediaReleaseId: number | null,
  bundleReleaseId: number | undefined,
  terminalId: string
) => {
  const db0 = await getDb();

  logToTerminal(terminalId, 'Initializing the archived database');

  const db = await getReleasedDb(bundleReleaseId, terminalId);
  const seriesId = await getSeriesId();

  logToTerminal(terminalId, 'Preparing the uploading task');

  const resourceToBeUploaded = db.resource.resources.find({
    type: 'file',
    removed: false,
  }) as IResourceFile[];

  logToTerminal(terminalId, `:: Resources: ${resourceToBeUploaded.length}`);

  const postProcessedFiles = db0.resource.postProcessed.find({
    type: 'file',
    removed: false,
  });

  const postProcessedResourceToBeUploaded = postProcessedFiles.filter((x) =>
    x.postProcessRecord.mediaBundleId.includes(
      mediaReleaseId === null
        ? Math.max(
            ...postProcessedFiles.flatMap(
              (f) => f.postProcessRecord.mediaBundleId
            )
          )
        : mediaReleaseId
    )
  );

  logToTerminal(
    terminalId,
    `:: Post processed: ${postProcessedResourceToBeUploaded.length}`
  );

  const allResources = [
    ...resourceToBeUploaded.map((x) => ({
      resourceType: 'normal' as const,
      resourceRecord: x,
    })),
    ...postProcessedResourceToBeUploaded.map((x) => ({
      resourceType: 'postProcessed' as const,
      resourceRecord: x,
    })),
  ];

  logToTerminal(terminalId, `:: Total: ${allResources.length}`);

  // Count categories count and decide initialize which uploader.
  // The key is category name, value is the count of the category.
  const taskCountByCategory: Record<string, number> = {};

  allResources.forEach((resource) => {
    resource.resourceRecord.tags.filter(Boolean).forEach((tag) => {
      if (!tag.startsWith('category')) return;
      if (!taskCountByCategory[tag]) taskCountByCategory[tag] = 0;
      taskCountByCategory[tag] += 1;
    });
  });

  logToTerminal(terminalId, `:: Categories:`);

  Object.entries(taskCountByCategory).forEach(([key, value]) => {
    logToTerminal(terminalId, `:: :: ${key}: ${value}`);
  });

  const uploaderInstances = Object.entries(
    await getUploaderInstances([
      ...Object.keys(taskCountByCategory),
    ] as Category[])
  );

  // Initialize the task queue
  const taskQueue = new PromiseQueue(3);

  let skippedFiles = 0;
  let finishedFiles = 0;
  // Upload files
  uploaderInstances.forEach(
    ([serviceProviderLabel, { uploader, fileCategory }]) => {
      logToTerminal(
        terminalId,
        `:: Initializing ${serviceProviderLabel}`,
        Level.Info
      );
      const labelSegments = serviceProviderLabel.split('/');
      const shortServiceLabel = labelSegments[labelSegments.length - 1];
      // Upload resource file
      allResources.forEach(({ resourceType, resourceRecord }) => {
        const tags = resourceRecord.tags.filter(Boolean).map((x) => {
          if (x.endsWith('!')) return x.slice(0, -1);
          return x;
        });

        // If the file is already available on the CDN, skip uploading.
        if (resourceRecord.url[serviceProviderLabel]) {
          skippedFiles += 1;
          return;
        }

        // We're checking if the file should be uploaded to the CDN based on the
        // category tag.
        let needUpload = false;

        for (let i = 0; i < fileCategory.length; i += 1) {
          const category = fileCategory[i];

          if (tags.indexOf(category) !== -1) {
            needUpload = true;
            break;
          }
        }

        if (!needUpload) {
          // If the category of this resource is not in the list of acceptable
          // file category, skip uploading.
          // console.log(
          //   'Do not need to upload this file, since it is not in the list of acceptable file category'
          // );
          return;
        }

        taskQueue.enqueue(async () => {
          if (!resourceRecord.url) {
            resourceRecord.url = {};
          }

          try {
            logToTerminal(
              terminalId,
              `:: :: [${resourceRecord.id.substring(
                0,
                5
              )}] [${shortServiceLabel}] Uploading ${resourceRecord.label}`,
              Level.Info
            );

            const path = join(seriesId, 'resource');

            const file = await readFile(
              await getResourceFilePath(resourceRecord)
            );
            const url = await uploader.upload(file, resourceRecord, path);

            resourceRecord.url = {
              ...resourceRecord.url,
              [serviceProviderLabel]: url,
            };

            finishedFiles += 1;

            const find = {
              id: resourceRecord.id,
            };

            const update = <
              T extends PostProcessedResourceItemForUpload | IResourceItem
            >(
              x: T
            ) => {
              if (x.type === 'group') return x;

              x.url = {
                ...x.url,
                [serviceProviderLabel]: url,
              };

              return x;
            };

            if (resourceType === 'postProcessed') {
              db0.resource.postProcessed.findAndUpdate(find, update);
            } else {
              db0.resource.resources.findAndUpdate(find, update);
            }
          } catch (error) {
            console.error(error);
            logToTerminal(
              terminalId,
              `:: :: [${resourceRecord.id.substring(0, 5)}] ${
                resourceRecord.label
              } failed, ${
                error instanceof Error ? error.message : 'unknown error'
              }`,
              Level.Error
            );

            taskQueue.stop();

            throw error;
          }
        });
      });
    }
  );

  await taskQueue.run();

  logToTerminal(`:: Upload Task Summary`, Level.Info);
  logToTerminal(`:: :: Finished: ${finishedFiles}`, Level.Info);
  logToTerminal(`:: :: Skipped: ${skippedFiles}`, Level.Warning);

  return finishedFiles;
};
