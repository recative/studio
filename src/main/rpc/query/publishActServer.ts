/* eslint-disable no-console */
import { join } from 'path';

import StreamZip from 'node-stream-zip';

import { PreloadLevel, ResolutionMode } from '@recative/definitions';
import { TerminalMessageLevel as Level } from '@recative/studio-definitions';

import { logToTerminal } from './terminal';
import { getBuildPath, getUserData } from './setting';

import { getDb } from '../db';

import { getReleasedDb } from '../../utils/getReleasedDb';
import { BUNDLE_TYPE_MAP } from '../../constant/publish';
import { ReleaseNotFoundError } from '../../utils/errors/ReleaseNotFoundError';

import {
  OpenAPI,
  SeriesService,
  ReleaseService,
  AddReleaseRequestBody,
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
  const db0 = await getDb();
  const db = await getReleasedDb(bundleReleaseId);

  const releaseList: AddReleaseRequestBody[] = [];

  const targetRelease = db0.release.bundleReleases.findOne({
    id: bundleReleaseId,
  });

  if (!targetRelease) throw new ReleaseNotFoundError();

  const userData = getUserData();

  if (!userData) throw new Error("User didn't login");

  OpenAPI.BASE = userData.host;

  // == series ==
  logToTerminal(terminalId, `Find series information`);
  const series = db0.series.metadata.data[0];
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
  const mediaRelease = db0.release.mediaReleases.findOne({
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
  const codeRelease = db0.release.codeReleases.findOne({
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

  try {
    await ReleaseService.postReleaseReleaseIdEpisode(
      bundleReleaseId.toString(),
      series.id,
      db.episode.episodes.find({}).map((item) => {
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

  const apData = db.actPoint.actPoints.find({}).map((item) => {
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

  const resources = db.resource.resources.find({}).map((item) => {
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
  try {
    await ReleaseService.postReleaseReleaseIdAsset(
      bundleReleaseId.toString(),
      series.id,
      db.episode.assets.find({}).map((asset) => {
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
