/* eslint-disable no-console */
import { join } from 'path';

import StreamZip from 'node-stream-zip';

import { PreloadLevel, ResolutionMode } from '@recative/definitions';
import { TerminalMessageLevel as Level } from '@recative/studio-definitions';
import type {
  IAsset,
  IEpisode,
  IActPoint,
  IResourceItem,
} from '@recative/definitions';

import { getBuildPath, getUserData } from './setting';
import { logToTerminal } from './terminal';

import { getDb } from '../db';

import { ReleaseNotFoundError } from '../../utils/errors/ReleaseNotFoundError';
import { BUNDLE_TYPE_MAP } from '../../constant/publish';
import { getLokiCollectionFromMediaRelease } from '../../utils/getLokiCollectionFromMediaRelease';

import {
  OpenAPI,
  AddReleaseRequestBody,
  ReleaseService,
  SeriesService,
} from '../../../api';

/**
 *  Upload database to act server.
 * @param bundleReleaseId Release ID.
 * @param terminalId Output information to which terminal.
 */
export const uploadDatabase = async (
  bundleReleaseId: number,
  terminalId: string
) => {
  const db = await getDb();

  const releaseList: AddReleaseRequestBody[] = [];

  const targetRelease = db.release.bundleReleases.findOne({
    id: bundleReleaseId,
  });

  if (!targetRelease) throw new ReleaseNotFoundError();

  const userData = getUserData();

  if (!userData) throw new Error("User didn't login");

  OpenAPI.BASE = userData.host;

  // == series ==
  logToTerminal(terminalId, `Find series information`);
  const series = db.series.metadata.data[0];
  try {
    await SeriesService.getSeriesSeriesId(series.id);
  } catch (error) {
    if (error instanceof Error) {
      logToTerminal(terminalId, error.message, Level.Error);
    }
    logToTerminal(
      terminalId,
      'Series not found, Upload suspended',
      Level.Error
    );
    console.error(error);
    return;
  }

  // == release ==
  logToTerminal(terminalId, `Uploading release information`);

  logToTerminal(terminalId, `Uploading media release`);
  const mediaRelease = db.release.mediaReleases.findOne({
    id: targetRelease.mediaBuildId,
  });
  if (!mediaRelease) throw new ReleaseNotFoundError();
  releaseList.push({
    id: mediaRelease.id,
    seriesId: series.id,
    type: BUNDLE_TYPE_MAP.media,
    committer: parseInt(mediaRelease.committer, 10),
    notes: mediaRelease.notes,
  });

  logToTerminal(terminalId, `Uploading code release`);
  const codeRelease = db.release.codeReleases.findOne({
    id: targetRelease.codeBuildId,
  });
  if (!codeRelease) throw new ReleaseNotFoundError();
  releaseList.push({
    id: codeRelease.id,
    seriesId: series.id,
    type: BUNDLE_TYPE_MAP.code,
    committer: parseInt(codeRelease.committer, 10),
    notes: codeRelease.notes,
  });

  releaseList.push({
    id: targetRelease.id,
    seriesId: series.id,
    codeBuildId: codeRelease.id,
    mediaBuildId: mediaRelease.id,
    type: BUNDLE_TYPE_MAP.bundle,
    committer: parseInt(targetRelease.committer, 10),
    notes: targetRelease.notes,
  });
  try {
    await ReleaseService.postAdminSeriesSeriesIdRelease(series.id, releaseList);
  } catch (error) {
    if (error instanceof Error) {
      logToTerminal(terminalId, error.message, Level.Error);
    }
    logToTerminal(
      terminalId,
      'Release Insert Error, Upload suspended',
      Level.Error
    );
    return;
  }

  // Following data should be read from the database archive.

  // == episode ==
  logToTerminal(terminalId, `Uploading episode data`);
  const episodeCollection = await getLokiCollectionFromMediaRelease<IEpisode>(
    mediaRelease.id,
    'episode',
    'episodes'
  );

  try {
    await ReleaseService.postReleaseReleaseIdEpisode(
      bundleReleaseId.toString(),
      series.id,
      episodeCollection.data.map((item) => {
        return {
          id: item.id,
          label: item.label,
          order: item.order,
          largeCoverResourceId: item.largeCoverResourceId,
        };
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      logToTerminal(terminalId, error.message, Level.Error);
    }
    console.error(error);
  }

  // == ap ==
  logToTerminal(terminalId, `Uploading ap data`);

  const buildPath = await getBuildPath();

  const codeBundlePath = join(
    buildPath,
    `code-${codeRelease.id.toString().padStart(4, '0')}.zip`
  );

  const codeBundle = new StreamZip.async({ file: codeBundlePath });
  const codeFilesInBundle = Object.values(await codeBundle.entries())
    .map((x) => x.name)
    .filter((x) => x.endsWith('index.html'));

  const actPointCollection = await getLokiCollectionFromMediaRelease<IActPoint>(
    mediaRelease.id,
    'act-point',
    'actPoints'
  );

  const apData = actPointCollection.data.map((item) => {
    return {
      ...item,
      resolutionMode: item.resolutionMode || ResolutionMode.FollowPlayerSetting,
      localId: item.id.toString(),
      entryPoint:
        codeFilesInBundle
          .find((x) => {
            const sKey = x.toLowerCase();
            return sKey.includes(item.fullPath.toLowerCase());
          })
          ?.split(/[/\\]+/)[3] ?? '',
    };
  });

  try {
    await ReleaseService.postReleaseReleaseIdActPoint(
      bundleReleaseId.toString(),
      series.id,
      apData
    );
  } catch (error) {
    if (error instanceof Error) {
      logToTerminal(terminalId, error.message, Level.Error);
    }
    console.error(error);
  }

  // == resource ==
  logToTerminal(terminalId, `Uploading resource data`);
  const resourceCollection =
    await getLokiCollectionFromMediaRelease<IResourceItem>(
      mediaRelease.id,
      'resource',
      'resources'
    );

  const resources = resourceCollection.data.map((item) => {
    const tags = item.tags
      ? item.tags.map((tag) => {
          const tagSplit = tag.split(':');
          return {
            type: tagSplit[0],
            tag: tagSplit[1],
          };
        })
      : [];
    if ('preloadLevel' in item) {
      const url = item.url
        ? Object.entries(item.url).map(([uploaderExtensionId, urlValue]) => ({
            uploaderExtensionId,
            url: urlValue,
          }))
        : [];
      return {
        id: item.id,
        type: item.type,
        label: item.label,
        importTime: item.importTime,
        removed: item.removed,
        removedTime: item.removedTime,
        resourceGroupId: item.resourceGroupId,
        resourceTags: tags,
        // file
        mimeType: item.mimeType,
        originalHash: item.originalHash,
        xxHash: item.convertedHash.xxHash,
        md5Hash: item.convertedHash.md5,
        cacheToHardDisk: item.cacheToHardDisk,
        preloadLevel: Object.keys(PreloadLevel).indexOf(item.preloadLevel),
        preloadTriggers: item.preloadTriggers,
        episodes: item.episodeIds,
        duration: item.duration || 0,
        url,
      };
    }

    return {
      id: item.id,
      type: item.type,
      label: item.label,
      importTime: item.importTime,
      removed: item.removed,
      removedTime: item.removedTime,
      resourceGroupId: item.resourceGroupId,
      resourceTags: tags,
      files: item.files,
    };
  });

  try {
    await ReleaseService.postReleaseReleaseIdResource(
      bundleReleaseId.toString(),
      series.id,
      resources
    );
  } catch (error) {
    if (error instanceof Error) {
      logToTerminal(terminalId, error.message, Level.Error);
    }
    console.error(error);
  }

  // == asset ==
  logToTerminal(terminalId, `Uploading asset data`);
  const assetCollection = await getLokiCollectionFromMediaRelease<IAsset>(
    mediaRelease.id,
    'episode',
    'assets'
  );

  try {
    await ReleaseService.postReleaseReleaseIdAsset(
      bundleReleaseId.toString(),
      series.id,
      assetCollection.data.map((asset) => {
        return {
          id: asset.id,
          releaseId: Number(terminalId),
          contentLocalId: asset.contentId,
          episodeId: asset.episodeId,
          order: asset.order,
          contentExtensionId: asset.contentExtensionId,
          notes: asset.notes,
        };
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      logToTerminal(terminalId, error.message, Level.Error);
    }
    console.error(error);
  }

  // done
};
