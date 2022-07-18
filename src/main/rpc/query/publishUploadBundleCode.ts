/* eslint-disable no-console */
import { join } from 'path';

import StreamZip from 'node-stream-zip';

import { Category, TerminalMessageLevel as Level } from '@recative/definitions';

import { logToTerminal } from './terminal';

import { getDb } from '../db';

import { TaskQueue } from '../../utils/uploadTaskQueue';
import { getUploaderInstances } from '../../utils/getExtensionInstances';
import { getBuildPath } from './setting';

/**
 * Deploy code bundle to remote server.
 * @param codeReleaseId release ID of code release.
 * @param terminalId Output information to which terminal.
 */
export const uploadCodeBundle = async (
  codeReleaseId: string,
  terminalId: string
) => {
  const buildPath = await getBuildPath();
  const db = await getDb();

  const seriesId = db.series.metadata.findOne({})?.id;
  if (!seriesId) throw new Error('Series id not found!');

  const codeBundlePath = join(
    buildPath,
    `code-${codeReleaseId.padStart(4, '0')}.zip`
  );

  const codeBundle = new StreamZip.async({ file: codeBundlePath });
  const codeFileToBeUploaded = Object.values(await codeBundle.entries()).filter(
    (entry) => entry.isFile
  );

  const uploaderInstances = Object.entries(
    await getUploaderInstances([Category.ApBundle])
  );

  // Initialize the task queue
  const taskQueue = new TaskQueue({
    concurrent: 3,
    interval: 500,
    start: false,
  });

  uploaderInstances.forEach(([serviceProviderLabel, { uploader }]) => {
    // Upload Code bundle.
    codeFileToBeUploaded.forEach((codeFile) => {
      taskQueue.enqueue(async () => {
        logToTerminal(
          terminalId,
          `Uploading ${codeFile.name} with ${serviceProviderLabel}`,
          Level.Info
        );

        try {
          const path = join(
            seriesId,
            'code-release',
            codeReleaseId.padStart(4, '0')
          ).replaceAll('\\', '/');
          const file = await codeBundle.entryData(codeFile);
          await uploader.upload(file, codeFile.name, path);
        } catch (error) {
          logToTerminal(
            terminalId,
            `Upload Failed ${codeFile.name}}, ${
              error instanceof Error ? error.message : 'unknown error'
            }`,
            Level.Error
          );
        }
      });
    });
  });

  return taskQueue;
};
