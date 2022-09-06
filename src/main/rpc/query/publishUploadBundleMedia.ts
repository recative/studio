/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import { join } from 'path';
import { readFile } from 'fs/promises';

import { Category } from '@recative/definitions';
import { TerminalMessageLevel as Level } from '@recative/extension-sdk';
import type { IResourceFile, IResourceItem } from '@recative/definitions';
import type { IPostProcessedResourceFileForUpload } from '@recative/extension-sdk';

import { getSeriesId } from './series';
import { logToTerminal } from './terminal';

import { getDb } from '../db';

import { TaskQueue } from '../../utils/uploadTaskQueue';
import { getResourceFilePath } from '../../utils/getResourceFile';
import { getLokiCollectionFromMediaRelease } from '../../utils/getLokiCollectionFromMediaRelease';
import { getUploaderInstances } from '../../utils/getExtensionInstances';

/**
 * Deploy media bundle to remote server.
 * @param mediaReleaseId release ID of media release.
 * @param terminalId Output information to which terminal.
 */
export const uploadMediaBundle = async (
  mediaReleaseId: number,
  terminalId: string
) => {
  const db = await getDb();
  const seriesId = await getSeriesId();

  const resourceCollection =
    await getLokiCollectionFromMediaRelease<IResourceItem>(
      mediaReleaseId,
      'resource',
      'resources'
    );

  const postProcessedCollection =
    await getLokiCollectionFromMediaRelease<IPostProcessedResourceFileForUpload>(
      mediaReleaseId,
      'resource',
      'postProcessedResources'
    );

  const resourceToBeUploaded = resourceCollection.data.filter(
    (x) => x.type === 'file' && !x.removed
  ) as IResourceFile[];

  const postProcessedResourceToBeUploaded = postProcessedCollection.data.filter(
    (x) =>
      x.type === 'file' &&
      !x.removed &&
      x.postProcessRecord.mediaBundleId.includes(mediaReleaseId)
  );

  const allResources = [
    ...resourceToBeUploaded,
    ...postProcessedResourceToBeUploaded,
  ];

  // Count categories count and decide initialize which uploader.
  // The key is category name, value is the count of the category.
  const taskCountByCategory: Record<string, number> = {};

  allResources.forEach((resource) => {
    resource.tags.forEach((tag) => {
      if (!tag.startsWith('category')) return;
      if (!taskCountByCategory[tag]) taskCountByCategory[tag] = 0;
      taskCountByCategory[tag] += 1;
    });
  });

  const uploaderInstances = Object.entries(
    await getUploaderInstances([
      ...Object.keys(taskCountByCategory),
    ] as Category[])
  );

  // Initialize the task queue
  const taskQueue = new TaskQueue({
    concurrent: 1,
    interval: 50,
    start: false,
  });

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
      allResources.forEach((resourceFile) => {
        const resourceRecord:
          | IResourceFile
          | IPostProcessedResourceFileForUpload =
          (db.resource.resources.findOne({
            id: resourceFile.id,
          }) as IResourceFile) ??
          (db.resource.postProcessed.findOne({
            id: resourceFile.id,
          }) as IPostProcessedResourceFileForUpload);

        if (!resourceRecord) {
          logToTerminal(
            terminalId,
            `:: :: [${resourceFile.id.substring(0, 5)}] ${
              resourceFile.label
            } not found!`,
            Level.Error
          );
          return;
        }

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

          if (resourceFile.tags.indexOf(category) !== -1) {
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
          if (!resourceFile.url) {
            resourceFile.url = {};
          }

          try {
            logToTerminal(
              terminalId,
              `:: :: [${resourceFile.id.substring(
                0,
                5
              )}] [${shortServiceLabel}] Uploading ${resourceFile.label}`,
              Level.Info
            );

            const path = join(seriesId, 'resource');

            const file = await readFile(getResourceFilePath(resourceFile));
            const url = await uploader.upload(file, resourceFile, path);

            resourceRecord.url = {
              ...resourceRecord.url,
              [serviceProviderLabel]: url,
            };

            // logToTerminal(
            //   terminalId,
            //   `Uploaded ${resourceFile.label}, url: ${url}`,
            //   Level.Info
            // );
            finishedFiles += 1;

            if ('fileName' in resourceRecord) {
              db.resource.postProcessed.update(resourceRecord);
            } else {
              db.resource.resources.update(resourceRecord);
            }
          } catch (error) {
            console.error(error);
            logToTerminal(
              terminalId,
              `:: :: [${resourceFile.id.substring(0, 5)}] ${
                resourceFile.label
              } failed, ${
                error instanceof Error ? error.message : 'unknown error'
              }`,
              Level.Error
            );

            taskQueue.stop();
            taskQueue.clear();

            throw error;
          }
        });
      });
    }
  );

  taskQueue.on('end', () => {
    logToTerminal(`:: Upload Task Summary`, Level.Info);
    logToTerminal(`:: :: Finished: ${finishedFiles}`, Level.Info);
    logToTerminal(`:: :: Skipped: ${skippedFiles}`, Level.Warning);
  });

  return taskQueue;
};
