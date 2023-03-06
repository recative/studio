import type { ExtensionManifest } from '@recative/extension-sdk';

import aliOssExtension from '@recative/extension-ali-oss';
import s3BucketExtension from '@recative/extension-s3-bucket';
import polyVVodExtension from '@recative/extension-polyv-vod';

import avExtension from '@recative/extension-av';
import gitExtension from '@recative/extension-git';
import sftpExtension from '@recative/extension-sftp';
import atlasExtension from '@recative/extension-atlas';
import textureExtension from '@recative/extension-texture';
import audioBackendsExtension from '@recative/extension-audio-backends';
import offlineBundleExtension from '@recative/extension-offline-bundle';

import webBundlerExtension from '@recative/extension-web';
import rawBundlerExtension from '@recative/extension-raw';
import iosIpaBundlerExtension from '@recative/extension-ios';
import androidApkBundlerExtension from '@recative/extension-android';

import crowdinExtension from '@recative/extension-crowdin';
import dbFixerExtension from '@recative/extension-db-fixer';
import i18nUtilsExtension from '@recative/extension-i18n-utils';
import resourceExporterExtension from '@recative/extension-resource-exporter';

export const extensions = [
  aliOssExtension,
  s3BucketExtension,
  polyVVodExtension,
  avExtension,
  atlasExtension,
  offlineBundleExtension,
  iosIpaBundlerExtension,
  androidApkBundlerExtension,
  webBundlerExtension,
  rawBundlerExtension,
  audioBackendsExtension,
  i18nUtilsExtension,
  dbFixerExtension,
  crowdinExtension,
  resourceExporterExtension,
  textureExtension,
  sftpExtension,
  gitExtension,
] as ExtensionManifest[];
