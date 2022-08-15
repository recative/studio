/* eslint-disable no-restricted-syntax */
import { join } from 'path';
import { rmdir } from 'fs/promises';
import { cloneDeep } from 'lodash';

import StreamZip from 'node-stream-zip';
import { encode } from '@msgpack/msgpack';
import { rename, copy, existsSync } from 'fs-extra';

import { stringify as uglyJSONstringify } from '@recative/ugly-json';
import { Zip, TerminalMessageLevel as Level } from '@recative/extension-sdk';
import type {
  IBundleProfile,
  PostProcessedResourceItemForUpload,
} from '@recative/extension-sdk';

import { cleanupLoki } from './utils';
import { getBuildPath } from './setting';
import { logToTerminal } from './terminal';
import { getEpisodeDetailList } from './episode';

import { getReleasedDb } from '../../utils/getReleasedDb';
import { analysisPostProcessedRecords } from '../../utils/analysisPostProcessedRecords';

const getBundlerConfigs = async (
  mediaReleaseId: number | null,
  codeReleaseId: number,
  bundleReleaseId: number,
  profile?: IBundleProfile,
  terminalId?: string
) => {
  const db = getReleasedDb(bundleReleaseId, terminalId);

  if (profile && mediaReleaseId === null) {
    throw new Error('mediaReleaseId is required when profile is provided');
  }

  const episodes = cloneDeep(
    await getEpisodeDetailList(
      null,
      profile
        ? {
            type: 'bundleProfile',
            mediaReleaseId: mediaReleaseId as number,
            codeReleaseId,
            bundleProfile: profile,
          }
        : {
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
 * @param bundleReleaseId Release ID of bundle release.
 * @param terminalId Output information to which terminal.
 */
export const dumpPlayerConfigs = async (
  zip: Zip,
  mediaReleaseId: number,
  codeReleaseId: number,
  bundleReleaseId: number,
  appTemplatePublicPath: string,
  profile: IBundleProfile,
  terminalId?: string
) => {
  logToTerminal(terminalId, `Extracting episode configurations`, Level.Info);
  const episodes = await getBundlerConfigs(
    mediaReleaseId,
    codeReleaseId,
    bundleReleaseId,
    profile,
    terminalId
  );

  episodes.forEach((x) => {
    x.episode = cleanupLoki(x.episode);
    x.assets = x.assets.map((asset) => {
      asset.spec = cleanupLoki(asset.spec) as any;

      return cleanupLoki(asset);
    });
    x.resources = x.resources.map(cleanupLoki) as typeof x.resources;
  });

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

  let serializer: (x: unknown) => string | Uint8Array;

  switch (profile.metadataFormat) {
    case 'json':
      serializer = JSON.stringify;
      break;
    case 'uson':
      serializer = uglyJSONstringify;
      break;
    case 'bson':
      serializer = encode;
      break;
    default:
      throw new Error('Unknown metadata format');
  }

  const writeData = (x: string | Uint8Array, to: string) => {
    if (typeof x === 'string') {
      return zip.appendText(x, to);
    }
    const buffer = Buffer.from(x);
    return zip.appendFile(buffer, to);
  };

  const episodesData = serializer(episodeAbstraction);

  const playerConfigPath = join(appTemplatePublicPath, 'bundle');

  await writeData(
    episodesData,
    join(playerConfigPath, 'data', `episodes.${profile.metadataFormat}`)
  );

  for (const episode of episodes) {
    await writeData(
      serializer(episode),
      join(
        playerConfigPath,
        'data',
        `${episode.episode.id}.${profile.metadataFormat}`
      )
    );
  }
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

  // await dumpPlayerConfigs(
  //   mediaReleaseId,
  //   codeReleaseId,
  //   bundleReleaseId,
  //   terminalId
  // );
  await dumpActPointArtifacts(codeReleaseId, bundleReleaseId, terminalId);
  await dumpMediaResources(mediaReleaseId, bundleReleaseId, terminalId);
};
