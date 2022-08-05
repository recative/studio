/* eslint-disable no-restricted-syntax */
import { join } from 'path';
import { rmdir } from 'fs/promises';
import { cloneDeep } from 'lodash';

import StreamZip from 'node-stream-zip';
import { encode } from '@msgpack/msgpack';
import { ensureDir, writeFileSync, rename, copy, existsSync } from 'fs-extra';

import { TerminalMessageLevel as Level } from '@recative/definitions';

import { PostProcessedResourceItemForUpload } from '@recative/extension-sdk';
import { logToTerminal } from './terminal';
import { getEpisodeDetailList } from './episode';

import { getBuildPath } from './setting';
import { getReleasedDb } from '../../utils/getReleasedDb';
import { analysisPostProcessedRecords } from '../../utils/analysisPostProcessedRecords';
import { cleanupLoki } from './utils';

const getBundlerConfigs = async (
  codeReleaseId: number,
  bundleReleaseId: number
) => {
  const db = getReleasedDb(bundleReleaseId);

  const episodes = cloneDeep(
    await getEpisodeDetailList(
      null,
      {
        type: 'playerShell',
        codeReleaseId,
      },
      db
    )
  );

  return episodes;
};

/**
 * Dumping all binary data files to player dump path.
 *
 * @param codeReleaseId release ID of code release.
 * @param mediaReleaseId release ID of media release.
 * @param bundleReleaseId Release ID of bundle release.
 * @param terminalId Output information to which terminal.
 */
export const dumpPlayerConfigs = async (
  codeReleaseId: number,
  bundleReleaseId: number,
  terminalId: string
) => {
  const buildPath = await getBuildPath();

  logToTerminal(terminalId, `Extracting episode configurations`, Level.Info);
  const episodes = await getBundlerConfigs(codeReleaseId, bundleReleaseId);

  episodes.forEach((x) => {
    x.episode = cleanupLoki(x.episode);
    x.assets = x.assets.map(cleanupLoki);
    x.resources = x.resources.map(cleanupLoki) as typeof x.resources;
  });

  const playerBundlePath = join(
    buildPath,
    `player-${bundleReleaseId.toString().padStart(4, '0')}`
  );
  await ensureDir(playerBundlePath);
  const dataDir = join(playerBundlePath, 'data');

  logToTerminal(terminalId, `:: Episodes`);

  episodes.forEach((episode) => {
    const totalResourceCount = episode.resources.length;
    const postProcessedRecords = episode.resources.filter(
      (resource) => 'postProcessRecord' in resource
    );

    const postProcessCombination = analysisPostProcessedRecords(
      postProcessedRecords as PostProcessedResourceItemForUpload[]
    );

    logToTerminal(
      terminalId,
      `:: :: ${episode.episode.label.en} (${episode.episode.id})`
    );

    logToTerminal(terminalId, `:: :: :: Total: ${totalResourceCount}`);
    logToTerminal(
      terminalId,
      `:: :: :: Processed: ${postProcessedRecords.length}`
    );

    postProcessCombination.forEach((value, key) => {
      logToTerminal(terminalId, `:: :: :: :: ${key}: ${value}`);
    });
  });

  const episodeAbstraction = episodes.map(({ episode, assets, key }) => ({
    episode,
    assets,
    key,
  }));

  logToTerminal(terminalId, `Writing binary files`, Level.Info);
  ensureDir(dataDir);
  ensureDir(join(dataDir, 'bson'));
  ensureDir(join(dataDir, 'json'));
  writeFileSync(
    join(dataDir, 'bson', 'episodes.bson'),
    encode(episodeAbstraction)
  );
  writeFileSync(
    join(dataDir, 'json', 'episodes.json'),
    JSON.stringify(episodeAbstraction)
  );

  episodes.forEach((episode) => {
    writeFileSync(
      join(dataDir, 'bson', `${episode.episode.id}.bson`),
      encode(episode)
    );
    writeFileSync(
      join(dataDir, 'json', `${episode.episode.id}.json`),
      JSON.stringify(episode)
    );
  });
};

/**
 * Extracting act point artifacts to player dump path.
 *
 * @param codeReleaseId release ID of code release.
 * @param bundleReleaseId Release ID of bundle release.
 * @param terminalId Output information to which terminal.
 */
const dumpActPointArtifacts = async (
  codeReleaseId: number,
  bundleReleaseId: number,
  terminalId: string
) => {
  const buildPath = await getBuildPath();

  const codeBundlePath = join(
    buildPath,
    `code-${codeReleaseId.toString().padStart(4, '0')}.zip`
  );
  const playerBundlePath = join(
    buildPath,
    `player-${bundleReleaseId.toString().padStart(4, '0')}`
  );

  const zip = new StreamZip.async({ file: codeBundlePath });

  logToTerminal(
    terminalId,
    `Extracting building artifacts from ${bundleReleaseId}`,
    Level.Info
  );

  await zip.extract(null, playerBundlePath);
  await zip.close();

  await rename(join(playerBundlePath, 'dist'), join(playerBundlePath, 'ap'));
};

/**
 * Copy resource media files to player dump path.
 *
 * @param mediaReleaseId release ID of media release.
 * @param bundleReleaseId Release ID of bundle release.
 * @param terminalId Output information to which terminal.
 */
const dumpMediaResources = async (
  mediaReleaseId: number,
  bundleReleaseId: number,
  terminalId: string
) => {
  const buildPath = await getBuildPath();

  const resourceDir = `resource-${mediaReleaseId.toString().padStart(4, '0')}`;
  const resourcePath = `${buildPath}/${resourceDir}`;

  const playerBundlePath = join(
    buildPath,
    `player-${bundleReleaseId.toString().padStart(4, '0')}`
  );

  logToTerminal(
    terminalId,
    `Copy media file of ${bundleReleaseId}`,
    Level.Info
  );

  const binaryResourceBundlePath = join(playerBundlePath, 'resource');
  await copy(join(resourcePath, 'binary'), binaryResourceBundlePath, {
    overwrite: true,
  });
};

export const publishPlayerBundle = async (
  codeReleaseId: number,
  mediaReleaseId: number,
  bundleReleaseId: number,
  terminalId: string
) => {
  const buildPath = await getBuildPath();

  const playerBundlePath = join(
    buildPath,
    `player-${bundleReleaseId.toString().padStart(4, '0')}`
  );

  if (existsSync(playerBundlePath)) {
    logToTerminal(terminalId, `Cleaning up old files`, Level.Info);
    await rmdir(playerBundlePath, { recursive: true });
  }

  await dumpPlayerConfigs(codeReleaseId, bundleReleaseId, terminalId);
  await dumpActPointArtifacts(codeReleaseId, bundleReleaseId, terminalId);
  await dumpMediaResources(mediaReleaseId, bundleReleaseId, terminalId);
};
