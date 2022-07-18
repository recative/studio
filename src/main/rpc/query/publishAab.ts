import { join } from 'path';

import { removeSync } from 'fs-extra';

import { getWorkspace } from '../workspace';
import { promisifySpawn } from '../../utils/promiseifySpawn';
import { STUDIO_BINARY_PATH } from '../../constant/appPath';
import {
  ANDROID_CONFIG_PATH,
  ANDROID_BUILD_TOOLS_PATH,
} from '../../constant/configPath';

import { publishApp } from './utils/publishApp';
import { getBuildPath } from './setting';
import { logToTerminal } from './terminal';
import { getVersionName } from './utils/getVersionName';
import { replaceManifest } from './utils/androidManifest';

const signAab = async (bundleReleaseId: number, terminalId: string) => {
  if (!ANDROID_BUILD_TOOLS_PATH) {
    throw new TypeError('Android build tools is not installed properly.');
  }

  const buildPath = await getBuildPath();

  const intermediateAabFileName = `android-${bundleReleaseId
    .toString()
    .padStart(4, '0')}-intermediate.aab.zip`;
  const signedAabFileName = `android-${bundleReleaseId
    .toString()
    .padStart(4, '0')}-signed.aab`;

  removeSync(signedAabFileName);

  // java -jar bundletool.jar build-bundle --modules=base_unsigned.zip --output=base_unsigned.aab
  await promisifySpawn(
    'java',
    [
      '-jar',
      join(STUDIO_BINARY_PATH, 'bundletool.jar'),
      'build-bundle',
      `--modules=${intermediateAabFileName}`,
      `--output=${signedAabFileName}`,
    ],
    {
      cwd: buildPath,
    },
    terminalId
  );

  if (process.arch !== 'x64' && process.arch !== 'arm64') {
    throw new Error(
      'Unsupported architecture, only x64 and arm64 are supported'
    );
  }

  if (
    process.platform !== 'darwin' &&
    process.platform !== 'linux' &&
    process.platform !== 'win32'
  ) {
    throw new Error(
      'Unsupported platform, only darwin, linux and win32 are supported'
    );
  }

  if (process.arch === 'arm64' && process.platform === 'win32') {
    throw new Error('Unsupported architecture, Windows does not support arm64');
  }

  const jarSignerExecutable = `jarsigner-${process.platform}-${process.arch}`;
  const jarsignerPath = join(STUDIO_BINARY_PATH, jarSignerExecutable);
  await promisifySpawn(
    jarsignerPath,
    [
      '-digestalg',
      'SHA1',
      '-sigalg',
      'SHA1withRSA',
      '-keystore',
      join(ANDROID_CONFIG_PATH, 'cert.jks'),
      '-storepass',
      '111111',
      '-keypass',
      '111111',
      signedAabFileName,
      'recative',
    ],
    {
      cwd: buildPath,
    },
    terminalId
  );
};

const MANIFEST_PATH = 'base/manifest/AndroidManifest.xml';
const OUTPUT_MANIFEST_PATH = 'manifest/AndroidManifest.xml';
const APP_TEMPLATE_FILE_NAME = 'template.aab';
const WEB_ROOT_TEMPLATE_FILE_NAME = 'mobile-web-root.zip';

/**
 * Execute all functions in this file one by one.
 *
 * @param codeReleaseId release ID of code release.
 * @param mediaReleaseId release ID of media release.
 * @param bundleReleaseId release ID of bundle release.
 * @param terminalId Output information to which terminal.
 */
export const publishAndroidAab = async (
  codeReleaseId: number,
  mediaReleaseId: number,
  bundleReleaseId: number,
  terminalId: string
) => {
  const workspace = getWorkspace();
  const aabFileName = `android-${bundleReleaseId
    .toString()
    .padStart(4, '0')}-intermediate.aab.zip`;

  await publishApp({
    codeReleaseId,
    mediaReleaseId,
    bundleReleaseId,
    appTemplateFileName: APP_TEMPLATE_FILE_NAME,
    appTemplateFromPath: 'base/',
    webRootTemplateFileName: 'mobile-web-root.zip',
    outputPublicPath: 'assets/public',
    appTemplatePublicPath: 'base/assets/public',
    outputFileName: aabFileName,
    excludeTemplateFilePaths: [MANIFEST_PATH],
    postProcess: async (archiver) => {
      logToTerminal(`Generating manifest...`, terminalId);
      const shellTemplatePath = join(
        workspace.assetsPath,
        APP_TEMPLATE_FILE_NAME
      );

      return replaceManifest({
        archive: archiver,
        shellTemplatePath,
        templateManifestPath: MANIFEST_PATH,
        outputManifestPath: OUTPUT_MANIFEST_PATH,
        versionName: await getVersionName(
          bundleReleaseId,
          WEB_ROOT_TEMPLATE_FILE_NAME,
          APP_TEMPLATE_FILE_NAME
        ),
        versionCode: bundleReleaseId,
        terminalId,
      });
    },
    terminalId,
  });
  await signAab(bundleReleaseId, terminalId);
};
