/* eslint-disable no-restricted-syntax */
import { join } from 'path';
import { cloneDeep } from 'lodash';

import { Zip } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/studio-definitions';

import type {
  IBundleProfile,
  PostProcessedResourceItemForUpload,
} from '@recative/extension-sdk';

import { cleanupLoki } from './utils/cleanupLoki';
import { logToTerminal } from './terminal';
import { getEpisodeDetailList } from './episode';

import { stringify } from '../../utils/serializer';
import { getReleasedDb } from '../../utils/getReleasedDb';
import { analysisPostProcessedRecords } from '../../utils/analysisPostProcessedRecords';

export const getBundlerConfigs = async (
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
      asset.spec = cleanupLoki(asset.spec);

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

  const writeData = (x: string | Uint8Array, to: string) => {
    if (typeof x === 'string') {
      return zip.appendText(x, to);
    }
    const buffer = Buffer.from(x);
    return zip.appendFile(buffer, to);
  };

  const episodesData = stringify(episodeAbstraction, profile.metadataFormat);

  const playerConfigPath = join(appTemplatePublicPath, 'bundle');

  await writeData(
    episodesData,
    join(playerConfigPath, 'data', `episodes.${profile.metadataFormat}`)
  );

  for (const episode of episodes) {
    await writeData(
      stringify(episode, profile.metadataFormat),
      join(
        playerConfigPath,
        'data',
        `${episode.episode.id}.${profile.metadataFormat}`
      )
    );
  }
};
