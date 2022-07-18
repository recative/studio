import { join } from 'path';

import { getWorkspace } from '../workspace';
import { promisifySpawn } from '../../utils/promiseifySpawn';
import {
  ANDROID_CONFIG_PATH,
  ANDROID_BUILD_TOOLS_PATH,
} from '../../constant/configPath';

import { publishApp } from './utils/publishApp';
import { getBuildPath } from './setting';
import { logToTerminal } from './terminal';
import { getVersionName } from './utils/getVersionName';
import { replaceManifest } from './utils/androidManifest';

const signApk = async (bundleReleaseId: number, terminalId: string) => {
  if (!ANDROID_BUILD_TOOLS_PATH) {
    throw new TypeError('Android build tools is not installed properly.');
  }

  const buildPath = await getBuildPath();

  const rawApkFileName = `android-${bundleReleaseId
    .toString()
    .padStart(4, '0')}.apk`;
  const alignedApkFileName = `android-${bundleReleaseId
    .toString()
    .padStart(4, '0')}-aligned.apk`;
  const signedApkFileName = `android-${bundleReleaseId
    .toString()
    .padStart(4, '0')}-signed.apk`;

  await promisifySpawn(
    join(ANDROID_BUILD_TOOLS_PATH, 'zipalign'),
    ['-p', '-f', '-v', '4', rawApkFileName, alignedApkFileName],
    {
      cwd: buildPath,
    },
    terminalId
  );

  await promisifySpawn(
    'java',
    [
      '-jar',
      join(ANDROID_BUILD_TOOLS_PATH, 'lib', 'apksigner.jar'),
      'sign',
      '--v4-signing-enabled',
      'false',
      '--key',
      join(ANDROID_CONFIG_PATH, 'pkcs8_private.pk8'),
      '--cert',
      join(ANDROID_CONFIG_PATH, 'cert.x509.pem'),
      '-in',
      alignedApkFileName,
      '-out',
      signedApkFileName,
    ],
    {
      cwd: buildPath,
    }
  );
};

const MANIFEST_PATH = 'AndroidManifest.xml';
const OUTPUT_MANIFEST_PATH = MANIFEST_PATH;
const APP_TEMPLATE_FILE_NAME = 'template.apk';
const WEB_ROOT_TEMPLATE_FILE_NAME = 'mobile-web-root.zip';

/**
 * Execute all functions in this file one by one.
 *
 * @param codeReleaseId release ID of code release.
 * @param mediaReleaseId release ID of media release.
 * @param bundleReleaseId release ID of bundle release.
 * @param terminalId Output information to which terminal.
 */
export const publishAndroidApk = async (
  codeReleaseId: number,
  mediaReleaseId: number,
  bundleReleaseId: number,
  terminalId: string
) => {
  const workspace = getWorkspace();
  const apkFileName = `android-${bundleReleaseId
    .toString()
    .padStart(4, '0')}.apk`;

  await publishApp({
    codeReleaseId,
    mediaReleaseId,
    bundleReleaseId,
    appTemplateFileName: APP_TEMPLATE_FILE_NAME,
    appTemplateFromPath: null,
    webRootTemplateFileName: WEB_ROOT_TEMPLATE_FILE_NAME,
    outputPublicPath: 'assets/public',
    outputFileName: apkFileName,
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
        apkMode: true,
        terminalId,
      });
    },
    terminalId,
  });

  await signApk(bundleReleaseId, terminalId);
};
