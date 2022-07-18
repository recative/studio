/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import { join } from 'path';
import { readFile } from 'fs/promises';

import { Category, TerminalMessageLevel as Level } from '@recative/definitions';
import type { IResourceFile, IResourceItem } from '@recative/definitions';

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

  const resourceToBeUploaded = resourceCollection.data.filter(
    (x) => x.type === 'file' && !x.removed
  ) as IResourceFile[];

  // Count categories count and decide initialize which uploader.
  // The key is category name, value is the count of the category.
  const taskCountByCategory: Record<string, number> = {};

  resourceToBeUploaded.forEach((resource) => {
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

  // Upload files
  uploaderInstances.forEach(
    ([serviceProviderLabel, { uploader, fileCategory }]) => {
      // Upload resource file
      resourceToBeUploaded.forEach((resourceFile) => {
        const resourceRecord = db.resource.resources.findOne({
          id: resourceFile.id,
        }) as unknown as IResourceFile;

        if (!resourceRecord) {
          logToTerminal(
            terminalId,
            `[!!] Resource ${resourceFile.label} (${resourceFile.id}) not found!`,
            Level.Error
          );
          return;
        }

        // If the file is already available on the CDN, skip uploading.
        // if (resourceRecord.url[serviceProviderLabel]) {
        //   logToTerminal(
        //     terminalId,
        //     `${resourceFile.label} is already available on CDN, with url: ${resourceRecord.url[serviceProviderLabel]}`,
        //     Level.Info
        //   );
        //   return;
        // }

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
              `[!!] Uploading ${resourceFile.label} (${resourceFile.id})`,
              Level.Info
            );

            const path = join(seriesId, 'resource');

            const file = await readFile(getResourceFilePath(resourceFile));
            const url = await uploader.upload(file, resourceFile, path);

            resourceRecord.url = {
              ...resourceRecord.url,
              [serviceProviderLabel]: url,
            };

            logToTerminal(
              terminalId,
              `Uploaded ${resourceFile.label}, url: ${url}`,
              Level.Info
            );
            db.resource.resources.update(resourceRecord);
          } catch (error) {
            console.error(error);
            logToTerminal(
              terminalId,
              `Upload Failed ${resourceFile.label}(${resourceFile.id}), ${
                error instanceof Error ? error.message : 'unknown error'
              }`,
              Level.Error
            );

            throw error;
          }
        });
      });
    }
  );

  return taskQueue;
};
