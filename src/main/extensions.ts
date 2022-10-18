import type { ExtensionManifest } from '@recative/extension-sdk';

import aliOssExtension from '@recative/extension-ali-oss';
import s3BucketExtension from '@recative/extension-s3-bucket';
import polyVVodExtension from '@recative/extension-polyv-vod';

import avExtension from '@recative/extension-av';
import atlasExtension from '@recative/extension-atlas';
import offlineBundleExtension from '@recative/extension-offline-bundle';
import audioBackendsExtension from '@recative/extension-audio-backends';

import iosIpaBundlerExtension from '@recative/extension-ios';
import androidApkBundlerExtension from '@recative/extension-android';
import webBundlerExtension from '@recative/extension-web';
import rawBundlerExtension from '@recative/extension-raw';

import i18nUtils from '@recative/extension-i18n-utils';

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
  i18nUtils,
] as ExtensionManifest[];
