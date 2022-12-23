import { fileSync } from 'tmp';

import { Zip } from '@recative/extension-sdk';
import { DB_CONFIG } from '@recative/studio-definitions';

import { getEpisodeDetailList } from './episode';

import { getDb } from '../db';
import { getReleasedDb } from '../../utils/getReleasedDb';
import { ReleaseNotFoundError } from '../../utils/errors/ReleaseNotFoundError';

import { cleanupLoki } from './utils';
import { addStorage } from './authService';
import { logToTerminal } from './terminal';
import { getBuildPath } from './setting';

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
    formattedEpisode.map((x) => {
      const metadataId = `@${seriesId}/${x.episode.id}`;
      return addStorage(
        metadataId,
        JSON.stringify(x),
        [metadataId],
        1,
        `Client side metadata for ${x.episode.label.en}`
      );
    })
  );

  await addStorage(
    `@${seriesId}/abstract`,
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

  await Promise.all(
    Object.values(DB_CONFIG).map(({ file }) => {
      return zip.transfer(databaseBackupPath, file);
    })
  );

  await zip.done();
  const buffer = await zip.getBuffer();

  await addStorage(
    `@${seriesId}/db`,
    buffer.toString('base64'),
    [],
    1,
    `Database backup for ${series?.title.label}`
  );
};
