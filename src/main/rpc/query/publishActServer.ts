import console from 'electron-log';
import tempfile from 'tempfile';
import Downloader from 'nodejs-file-downloader';
import StreamZip from 'node-stream-zip';

import { join } from 'path';
import { writeFile } from 'fs/promises';
import { ensureDir, copy } from 'fs-extra';
import { fileSync, dirSync } from 'tmp';

import { Zip } from '@recative/extension-sdk';
import { DB_CONFIG, JoinMode } from '@recative/studio-definitions';
import { IResourceFile, IResourceGroup } from '@recative/definitions';

import { cleanupLoki } from './utils/cleanupLoki';
import { getBuildPath } from './setting';
import { logToTerminal } from './terminal';
import { getEpisodeDetailList } from './episode';
import { getStorage, ensureStorage } from './authService';

import { fileExists } from '../../utils/fileExists';
import { PromiseQueue } from '../../utils/PromiseQueue';
import { getReleasedDb } from '../../utils/getReleasedDb';
import { getResourceFilePath } from '../../utils/getResourceFile';
import { ReleaseNotFoundError } from '../../utils/errors/ReleaseNotFoundError';
import { getWorkspace, setupWorkspace } from '../workspace';
import { getResourceProcessorInstances } from '../../utils/getResourceProcessorInstances';
import { getDb, saveAllDatabase, setupDb } from '../db';

import { lockDb } from './lock';
import { closeDb } from './project';
import { uploadMediaBundle } from './publishUploadBundleMedia';
import {
  extractDb,
  mergeDatabase,
  replaceDatabase,
} from './utils/mergeDatabases';

const createDatabaseBackup = async (output: string | Zip) => {
  const zip = output instanceof Zip ? output : new Zip(output);
  const { dbPath } = getWorkspace();

  for (const { file } of Object.values(DB_CONFIG)) {
    await zip.appendFile(join(dbPath, file), file);
  }

  if (typeof output === 'string') {
    await zip.done();
  }

  return zip;
};

const uploadDatabaseBackupBundle = async (
  bundleReleaseId: number | null,
  terminalId = 'uploadDatabaseBackupBundle'
) => {
  const db = await getDb();

  const series = db.series.metadata.findOne({});
  const seriesId = series?.id;

  logToTerminal(terminalId, `Uploading database backup`);

  const outputFilePath = fileSync().name;

  const buildPath = await getBuildPath();

  let zip: Zip;
  if (bundleReleaseId !== null) {
    zip = new Zip(outputFilePath);
    const targetRelease = db.release.bundleReleases.findOne({
      id: bundleReleaseId,
    });

    if (!targetRelease) {
      throw new TypeError(`Target release not found`);
    }

    const mediaBuildId = targetRelease.mediaBuildId.toString().padStart(4, '0');

    const databaseBackupPath = `${buildPath}/db-${mediaBuildId}.zip`;
    const dbConfigs = Object.values(DB_CONFIG);

    for (let i = 0; i < dbConfigs.length; i += 1) {
      const { file } = dbConfigs[i];
      await zip.transfer(databaseBackupPath, file, file);
    }

    await zip.done();
  } else {
    await saveAllDatabase(db);
    zip = await createDatabaseBackup(outputFilePath);
  }

  const bundleId = bundleReleaseId === null ? Date.now() : bundleReleaseId;
  const buffer = await zip.getBuffer();

  await ensureStorage(
    `@${seriesId}/${bundleId}/db`,
    buffer.toString('base64'),
    [],
    1,
    `Database backup for ${series?.title.label}`
  );
};

/**
 *  Upload database to act server.
 * @param bundleReleaseId Release ID.
 * @param terminalId Output information to which terminal.
 */
export const uploadDatabase = async (
  bundleReleaseId: number,
  terminalId: string
) => {
  const db0 = await getDb();
  const db = getReleasedDb(bundleReleaseId);
  const targetRelease = db0.release.bundleReleases.findOne({
    id: bundleReleaseId,
  });
  if (!targetRelease) throw new ReleaseNotFoundError();

  logToTerminal(terminalId, `Generating episode detail list`);

  const episodes = await getEpisodeDetailList(
    {
      type: 'playerShell',
      codeReleaseId: targetRelease.codeBuildId,
    },
    db
  );

  logToTerminal(terminalId, `Formatting episode detail list`);

  const formattedEpisode = episodes.map((x) => {
    return {
      ...x,
      episode: cleanupLoki(x.episode),
      assets: x.assets.map((asset) => {
        asset.spec = cleanupLoki(asset.spec);

        return cleanupLoki(asset);
      }),
      resources: x.resources.map(cleanupLoki) as typeof x.resources,
    };
  });

  const episodeAbstraction = episodes.map((x) => {
    return {
      episode: cleanupLoki(x.episode),
      assets: x.assets.map((asset) => {
        return cleanupLoki({
          ...asset,
          spec: cleanupLoki(asset.spec),
        });
      }),
      key: x.key,
    };
  });

  const series = db0.series.metadata.findOne({});
  const seriesId = series?.id;

  logToTerminal(terminalId, `Uploading episode detail list`);

  await Promise.allSettled(
    formattedEpisode.map((x) =>
      ensureStorage(
        `@${seriesId}/${bundleReleaseId}/${x.episode.id}`,
        JSON.stringify(x),
        [`@${seriesId}/${x.episode.id}`],
        1,
        `Client side metadata for ${x.episode.label.en}`
      )
    )
  );

  await ensureStorage(
    `@${seriesId}/${bundleReleaseId}/abstract`,
    JSON.stringify(episodeAbstraction),
    formattedEpisode.map((x) => `@${seriesId}/${x.episode.id}`),
    1,
    `Client side abstract for ${series?.title.label}`
  );

  await uploadDatabaseBackupBundle(bundleReleaseId, terminalId);
};

const recoverStatus = {
  message: 'No task required',
  status: 'working' as 'working' | 'success' | 'failed',
};

export const getRecoverBackupStatus = () => recoverStatus;

export const recoverBackup = async (storageId: string, joinMode: JoinMode) => {
  recoverStatus.status = 'working';
  recoverStatus.message = 'Recovering Backup...';

  const {
    dbPath,
    mediaPath,
    mediaWorkspacePath,
    codeRepositoryPath,
    readonly,
  } = getWorkspace();

  await lockDb();

  let outputPath: string | undefined;
  try {
    const db = await getDb();
    await saveAllDatabase(db);

    const buildPath = await getBuildPath();
    recoverStatus.message = 'Backing up database...';
    outputPath = `${buildPath}/db-backup-${Date.now()}.zip`;

    recoverStatus.message = 'Saving existed database...';

    await createDatabaseBackup(outputPath);
  } catch (e) {
    console.error(e);
  }

  recoverStatus.message = 'Downloading the backup...';

  const storageContent = await getStorage(storageId);
  const buffer = Buffer.from(storageContent.value, 'base64');

  const filePath = tempfile('.recative.zip');
  await writeFile(filePath, buffer);

  console.log(`The file is written to ${filePath}`);

  try {
    await closeDb();

    const extractedDbPath = await extractDb(filePath);
    if (joinMode === JoinMode.replaceOld) {
      await replaceDatabase(dbPath, extractedDbPath);
    } else {
      await mergeDatabase(dbPath, extractedDbPath, joinMode);
    }

    recoverStatus.message = 'Database recovered...';
  } catch (e) {
    console.error(e);
    const errorCode = e instanceof Error ? e.name : 'Unknown Error';

    // Rolling back
    if (outputPath) {
      const newZip = new StreamZip.async({ file: outputPath });
      await Promise.all(
        Object.values(DB_CONFIG).map(({ file }) => {
          return newZip.extract(file, join(dbPath, file));
        })
      );

      recoverStatus.message = `Recover failed: ${errorCode}`;
      recoverStatus.status = 'failed';
    } else {
      recoverStatus.message = `Unable to rollback: ${errorCode}`;
      recoverStatus.status = 'failed';
    }
  } finally {
    await setupWorkspace(mediaWorkspacePath, codeRepositoryPath, readonly);
    await setupDb(dbPath);
  }

  const db = await getDb();
  const resourceFiles = db.resource.resources.find({
    removed: false,
    type: 'file',
  }) as IResourceFile[];

  const allPostProcessedFiles = db.resource.postProcessed.find({
    type: 'file',
    removed: false,
  });

  const postProcessedFile = allPostProcessedFiles.filter((x) =>
    x.postProcessRecord.mediaBundleId.includes(
      Math.max(
        ...allPostProcessedFiles.flatMap(
          (f) => f.postProcessRecord.mediaBundleId
        )
      )
    )
  );

  const totalTasks = postProcessedFile.length + resourceFiles.length;

  const directory = dirSync().name;
  await ensureDir(directory);

  const resourceProcessorInstances = Object.entries(
    await getResourceProcessorInstances('')
  );

  recoverStatus.message = `Recovering media file`;

  // Initialize the task queue
  const taskQueue = new PromiseQueue(3);

  await ensureDir(join(mediaPath, 'post-processed'));

  [...postProcessedFile, ...resourceFiles].forEach((x) => {
    taskQueue.enqueue(async () => {
      const urls = Object.values(x.url).filter((y) => y.startsWith('http'));
      const fileName = `${x.id}.resource`;

      for (let i = 0; i < urls.length; i += 1) {
        try {
          const url = urls[i];

          if (typeof url !== 'string') continue;

          const resourceFilePath = await getResourceFilePath(x, false, false);

          if (!(await fileExists(resourceFilePath))) {
            const downloader = new Downloader({ url, directory, fileName });
            await downloader.download();

            await copy(join(directory, fileName), resourceFilePath);
          }

          const thumbnailPath = await getResourceFilePath(x, true, false);
          const thumbnailExists = await fileExists(thumbnailPath);

          if (!thumbnailExists) {
            let generatedThumbnail: null | Buffer | string = null;
            for (let j = 0; j < resourceProcessorInstances.length; j += 1) {
              const [, processor] = resourceProcessorInstances[j];
              const thumbnail = await processor.generateThumbnail(x);

              if (thumbnail) {
                generatedThumbnail = thumbnail;
                break;
              }
            }

            if (generatedThumbnail) {
              if (typeof generatedThumbnail === 'string') {
                await copy(generatedThumbnail, thumbnailPath);
              } else if (Buffer.isBuffer(generatedThumbnail)) {
                await writeFile(thumbnailPath, generatedThumbnail);
              }
            }
          }

          break;
        } catch (e) {
          continue;
        } finally {
          const progress = ((totalTasks - taskQueue.length) / totalTasks) * 100;
          recoverStatus.message = `Recovering media file (${Math.round(
            progress
          )}%) ...`;
        }
      }
    });
  });

  await taskQueue.run();

  recoverStatus.message = 'Updating thumbnails';
  const groups = db.resource.resources.find({
    type: 'group',
    removed: false,
  }) as IResourceGroup[];

  for (let i = 0; i < groups.length; i += 1) {
    const group = groups[i];
    const firstFile = db.resource.resources.findOne({
      resourceGroupId: group.id,
      removed: false,
    });

    if (!firstFile) {
      (group as any).thumbnailSrc = undefined;
    } else {
      (group as any).thumbnailSrc = firstFile.thumbnailSrc;
    }
  }

  db.resource.resources.update(groups);

  recoverStatus.message = 'Recover success';
  recoverStatus.status = 'success';
};

export const uploadDatabaseBackup = async (
  publishMedia: boolean,
  terminalId = 'createDatabaseBackup'
) => {
  if (publishMedia) {
    await uploadMediaBundle(null, undefined, [], terminalId);
  }

  await uploadDatabaseBackupBundle(null);
};
