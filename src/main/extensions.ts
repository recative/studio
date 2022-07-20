import type { ExtensionManifest } from '@recative/extension-sdk';

import aliOssExtension from '@recative/extension-ali-oss';
import s3BucketExtension from '@recative/extension-s3-bucket';
import polyVVodExtension from '@recative/extension-polyv-vod';
import atlasExtension from '@recative/extension-atlas';

export const extensions = [
  aliOssExtension,
  s3BucketExtension,
  polyVVodExtension,
  atlasExtension,
] as ExtensionManifest[];
