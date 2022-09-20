import { join } from 'path';
import { pathExists } from 'fs-extra';

import { xxHash } from '@recative/extension-sdk';

import { getDb } from '../../db';
import { getWorkspace } from '../../workspace';

export const getVersionName = async (
  bundleReleaseId: number,
  webRootTemplateFileName: string,
  appTemplateFileName: string
) => {
  const workspace = getWorkspace();
  const db = await getDb();

  const r = db.release.bundleReleases.findOne({
    id: bundleReleaseId,
  });

  if (!r) {
    throw new TypeError('Bundle release not found');
  }

  const { assetsPath } = workspace;

  const containerComponentPath = join(
    assetsPath,
    'components',
    'containerComponents.js'
  );

  const containerComponentVersion = (await pathExists(containerComponentPath))
    ? `s=${await xxHash(containerComponentPath)}`
    : '';

  const webRootTemplateFilePath = join(assetsPath, webRootTemplateFileName);

  const webRootTemplateVersion = (await pathExists(containerComponentPath))
    ? `w=${await xxHash(webRootTemplateFilePath)}`
    : '';

  const appTemplateFilePath = join(assetsPath, appTemplateFileName);

  const appTemplateVersion = (await pathExists(appTemplateFilePath))
    ? `a=${await xxHash(appTemplateFilePath)}`
    : '';

  const trueVersion = [
    `b${r.id}=c${r.codeBuildId}+r${r.mediaBuildId}`,
    appTemplateVersion,
    webRootTemplateVersion,
    containerComponentVersion,
  ].filter(Boolean);

  return `0.0.0-{${trueVersion.join(';')}}`;
};
