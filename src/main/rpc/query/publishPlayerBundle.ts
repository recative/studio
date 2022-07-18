/* eslint-disable no-restricted-syntax */
import { join } from 'path';
import { rmdir } from 'fs/promises';
import { cloneDeep } from 'lodash';

import StreamZip from 'node-stream-zip';
import { encode } from '@msgpack/msgpack';
import { ensureDir, writeFileSync, rename, copy, existsSync } from 'fs-extra';

import { TerminalMessageLevel as Level } from '@recative/definitions';

import { logToTerminal } from './terminal';
import { getEpisodeDetailList } from './episode';

import { getDb } from '../db';

import { extractDbBackupToTempPath } from '../../utils/extractDbBackupToTempPath';
import { getBuildPath } from './setting';

const getBundlerConfigs = async (
  mediaReleaseId: number,
  codeReleaseId: number
) => {
  const dbPath = await extractDbBackupToTempPath(mediaReleaseId);
  const db = getDb(dbPath, true);

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
  mediaReleaseId: number,
  bundleReleaseId: number,
  terminalId: string
) => {
  const buildPath = await getBuildPath();

  logToTerminal(terminalId, `Extracting bundler configurations`, Level.Info);
  const episodes = await getBundlerConfigs(mediaReleaseId, codeReleaseId);
  const playerBundlePath = join(
    buildPath,
    `player-${bundleReleaseId.toString().padStart(4, '0')}`
  );
  await ensureDir(playerBundlePath);
  const dataDir = join(playerBundlePath, 'data');

  logToTerminal(terminalId, `Writing binary files`, Level.Info);
  ensureDir(dataDir);
  writeFileSync(join(dataDir, 'episodes.bson'), encode(episodes));
  writeFileSync(join(dataDir, 'episodes.json'), JSON.stringify(episodes));

  episodes.forEach((episode) => {
    writeFileSync(join(dataDir, `${episode.episode.id}.bson`), encode(episode));
    writeFileSync(
      join(dataDir, `${episode.episode.id}.json`),
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

  await dumpPlayerConfigs(
    codeReleaseId,
    mediaReleaseId,
    bundleReleaseId,
    terminalId
  );
  await dumpActPointArtifacts(codeReleaseId, bundleReleaseId, terminalId);
  await dumpMediaResources(mediaReleaseId, bundleReleaseId, terminalId);
};
