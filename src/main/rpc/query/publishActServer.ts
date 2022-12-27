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
import {
  addStorage,
  ensureStorage,
  getStorage,
  updateStorage,
} from './authService';

import { getWorkspace } from '../workspace';
import { getReleasedDb } from '../../utils/getReleasedDb';
import { ReleaseNotFoundError } from '../../utils/errors/ReleaseNotFoundError';
import { getDb, resetDb, saveAllDatabase } from '../db';

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
    [],
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

  await Promise.all(
    Object.values(DB_CONFIG).map(({ file }) => {
      return zip.transfer(databaseBackupPath, file, file);
    })
  );

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

  const db = await getDb();
  const buildPath = await getBuildPath();
  const workspace = getWorkspace();

  const { dbPath } = workspace;

  recoverStatus.message = 'Downloading the backup...';

  const storageContent = await getStorage(storageId);
  const buffer = Buffer.from(storageContent.value, 'base64');

  const filePath = tempfile();
  await writeFile(filePath, buffer);

  recoverStatus.message = 'Saving existed database...';

  await saveAllDatabase(db);

  recoverStatus.message = 'Backing up database...';
  const outputPath = `${buildPath}/db-backup-${Date.now()}.zip`;

  const zip = new Zip(outputPath);

  for (const { file } of Object.values(DB_CONFIG)) {
    await zip.appendFile(join(dbPath, file), file);
  }
  await zip.done();

  try {
    resetDb();
    const newZip = new StreamZip.async({ file: filePath });
    await Promise.all(
      Object.values(DB_CONFIG).map(({ file }) => {
        return newZip.extract(file, join(dbPath, file));
      })
    );

    recoverStatus.message = 'Database recovered...';
    recoverStatus.status = 'success';
  } catch (e) {
    // Rolling back
    const newZip = new StreamZip.async({ file: outputPath });
    await Promise.all(
      Object.values(DB_CONFIG).map(({ file }) => {
        return newZip.extract(file, join(dbPath, file));
      })
    );

    const errorCode = e instanceof Error ? e.name : 'Unknown Error';

    recoverStatus.message = `Recover failed: ${errorCode}`;
    recoverStatus.status = 'failed';
  } finally {
    await getDb(dbPath);
  }
};
