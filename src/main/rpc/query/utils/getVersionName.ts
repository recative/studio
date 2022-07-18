import { join } from 'path';
import { existsSync } from 'fs-extra';

import { getDb } from '../../db';
import { getWorkspace } from '../../workspace';
import { getFilePathHash } from '../../../utils/getFileHash';

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

  const containerComponentVersion = existsSync(containerComponentPath)
    ? `s=${await getFilePathHash(containerComponentPath)}`
    : '';

  const webRootTemplateFilePath = join(assetsPath, webRootTemplateFileName);

  const webRootTemplateVersion = existsSync(containerComponentPath)
    ? `w=${await getFilePathHash(webRootTemplateFilePath)}`
    : '';

  const appTemplateFilePath = join(assetsPath, appTemplateFileName);

  const appTemplateVersion = existsSync(appTemplateFilePath)
    ? `a=${await getFilePathHash(appTemplateFilePath)}`
    : '';

  const trueVersion = [
    `b${r.id}=c${r.codeBuildId}+r${r.mediaBuildId}`,
    appTemplateVersion,
    webRootTemplateVersion,
    containerComponentVersion,
  ].filter(Boolean);

  return `0.0.0-{${trueVersion.join(';')}}`;
};
