import { join } from 'path';

import { Zip } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/definitions';

import { getBuildPath } from '../setting';
import { logToTerminal } from '../terminal';

import { dumpPlayerConfigs } from '../publishPlayerBundle';

import { bundlePlayerConfig } from './bundlePlayerConfig';
import { duplicateBasePackage } from './duplicateBasePackage';
import { duplicateWebRootPackage } from './duplicateWebRootPackage';
import { bundleAdditionalModules } from './bundleAdditionalModules';
import { transferActPointArtifacts } from './transferActPointArtifacts';
import { bundleMediaResourcesWithoutEpisodeOrWithCacheProperty } from './bundleMediaResourcesWithoutEpisodeOrWithCacheProperty';

// import { createOfflineResourceBundle } from '../offlineResourceBundle';

interface IPublishAppOptions {
  /**
   * The release id of the bundle release.
   */
  codeReleaseId: number;
  /**
   * The release id of the bundle release.
   */
  mediaReleaseId: number;
  /**
   * The release id of the bundle release.
   */
  bundleReleaseId: number;
  /**
   * The file format of configurations.
   */
  configFormat: 'json' | 'bson' | 'uson';
  /**
   * The template file, which is used to generate the application file, could be
   * an APK, IPA or AAB etc.
   */
  appTemplateFileName?: string | null;
  /**
   * This option is developed for the AAB bundle, this is for the following
   * scenario: copy the `/base` path as the root of output file, and ignore
   * other files.
   */
  appTemplateFromPath?: string | null;
  /**
   * Exclude files in the template bundle.
   */
  excludeTemplateFilePaths?: string[];
  /**
   * The path for web root bundle bundle.
   */
  webRootTemplateFileName?: string | null;
  /**
   * The template path of app template, files inside this path will be excluded.
   */
  appTemplatePublicPath?: string;
  /**
   * The path of the public folder, the media bundle and web root bundle will
   * be copied to this path.
   */
  outputPublicPath: string;
  /**
   * The output file name of the application.
   */
  outputFileName: string;
  /**
   * Post process function for the output file.
   */
  postProcess?: (zip: Zip) => Promise<void>;
  /**
   * The terminal id of the terminal to output the information.
   */
  terminalId: string;
}

export const publishApp = async ({
  codeReleaseId,
  mediaReleaseId,
  bundleReleaseId,
  configFormat,
  appTemplateFileName = null,
  appTemplateFromPath = null,
  webRootTemplateFileName = null,
  excludeTemplateFilePaths = [],
  outputPublicPath,
  appTemplatePublicPath = outputPublicPath,
  postProcess,
  outputFileName,
  terminalId,
}: IPublishAppOptions) => {
  const buildPath = await getBuildPath();

  const outputPath = join(buildPath, outputFileName);

  const zip = new Zip(outputPath, {
    zlib: { level: 0 },
  });

  logToTerminal(terminalId, `Preparing for tasks`, Level.Info);
  await dumpPlayerConfigs(codeReleaseId, bundleReleaseId, terminalId);
  if (appTemplateFileName) {
    await duplicateBasePackage(
      zip,
      appTemplateFileName,
      appTemplateFromPath,
      appTemplatePublicPath,
      excludeTemplateFilePaths,
      terminalId
    );
  }

  if (webRootTemplateFileName) {
    duplicateWebRootPackage(
      zip,
      webRootTemplateFileName,
      outputPublicPath,
      [],
      terminalId
    );
  }
  await transferActPointArtifacts(
    zip,
    codeReleaseId,
    `${outputPublicPath}/bundle/ap`,
    terminalId
  );
  await bundlePlayerConfig(
    zip,
    bundleReleaseId,
    `${outputPublicPath}/bundle`,
    configFormat,
    terminalId
  );
  await bundleAdditionalModules(zip, outputPublicPath, terminalId);
  await bundleMediaResourcesWithoutEpisodeOrWithCacheProperty(
    zip,
    bundleReleaseId,
    mediaReleaseId,
    `${outputPublicPath}/bundle/resource`,
    terminalId
  );

  await postProcess?.(zip);

  await zip.done();
};
