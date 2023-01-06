import console from 'electron-log';
import tempfile from 'tempfile';
import StreamZip from 'node-stream-zip';
import { join } from 'path';
import { fileSync } from 'tmp';
import { writeFile } from 'fs/promises';

import { Zip } from '@recative/extension-sdk';
import { DB_CONFIG } from '@recative/studio-definitions';

import { cleanupLoki } from './utils';
import { getBuildPath } from './setting';
import { logToTerminal } from './terminal';
import { getEpisodeDetailList } from './episode';
import { getStorage, ensureStorage } from './authService';

import { getWorkspace, setupWorkspace } from '../workspace';
import { getReleasedDb } from '../../utils/getReleasedDb';
import { ReleaseNotFoundError } from '../../utils/errors/ReleaseNotFoundError';
import { getDb, saveAllDatabase, setupDb } from '../db';
import { closeDb } from './project';
import { lockDb } from './lock';

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

  logToTerminal(terminalId, `Uploading database backup`);

  const buildPath = await getBuildPath();
  const databaseBackupPath = `${buildPath}/db-${targetRelease.mediaBuildId
    .toString()
    .padStart(4, '0')}.zip`;

  const outputFilePath = fileSync().name;
  const zip = new Zip(outputFilePath);

  const dbConfigs = Object.values(DB_CONFIG);

  for (let i = 0; i < dbConfigs.length; i += 1) {
    const { file } = dbConfigs[i];
    await zip.transfer(databaseBackupPath, file, file);
  }

  await zip.done();
  const buffer = await zip.getBuffer();

  await ensureStorage(
    `@${seriesId}/${bundleReleaseId}/db`,
    buffer.toString('base64'),
    [],
    1,
    `Database backup for ${series?.title.label}`
  );
};

const recoverStatus = {
  message: 'No task required',
  status: 'working' as 'working' | 'success' | 'failed',
};

export const getRecoverBackupStatus = () => recoverStatus;

export const recoverBackup = async (storageId: string) => {
  recoverStatus.status = 'working';
  recoverStatus.message = 'Recovering Backup...';

  const workspace = getWorkspace();
  const { dbPath, mediaWorkspacePath, codeRepositoryPath, readonly } =
    workspace;

  await lockDb();

  let outputPath: string | undefined;
  try {
    const db = await getDb();
    await saveAllDatabase(db);

    const buildPath = await getBuildPath();
    recoverStatus.message = 'Backing up database...';
    outputPath = `${buildPath}/db-backup-${Date.now()}.zip`;

    recoverStatus.message = 'Saving existed database...';

    const zip = new Zip(outputPath);

    for (const { file } of Object.values(DB_CONFIG)) {
      await zip.appendFile(join(dbPath, file), file);
    }
    await zip.done();
  } catch (e) {
    console.error(e);
  }

  recoverStatus.message = 'Downloading the backup...';

  const storageContent = await getStorage(storageId);
  console.log(storageContent);
  const buffer = Buffer.from(storageContent.value, 'base64');

  const filePath = tempfile('.recative.zip');
  await writeFile(filePath, buffer);

  console.log(`The file is written to ${filePath}`);

  try {
    await closeDb();
    const newZip = new StreamZip.async({ file: filePath });
    await Promise.all(
      Object.values(DB_CONFIG).map(({ file }) => {
        return newZip.extract(file, join(dbPath, file));
      })
    );

    recoverStatus.message = 'Database recovered...';
    recoverStatus.status = 'success';
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
};
