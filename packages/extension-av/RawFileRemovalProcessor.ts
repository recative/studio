/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { ResourceProcessor } from '@recative/extension-sdk';
import { IResourceItem } from '@recative/definitions';
import type {
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

export interface OfflineBundleConfig {
  enable: string;
}

export class RawFileRemovalProcessor extends ResourceProcessor<
  keyof OfflineBundleConfig
> {
  static id = '@recative/extension-rs-av/RawFileRemovalProcessor';

  static label = 'Raw File Removal';

  static resourceConfigUiFields = [] as const;

  static nonMergeableResourceExtensionConfiguration = [];

  async beforePublishMediaBundle(
    resources: IPostProcessedResourceFileForUpload[]
  ) {
    return resources;
  }

  afterGroupCreated() {
    return null;
  }

  beforePublishApplicationBundle = async (
    resources: (PostProcessedResourceItemForUpload | IResourceItem)[]
  ) => {
    return resources.filter(
      (x) => x.type === 'group' || !x.tags.includes('custom:raw!')
    );
  };

  beforeFileImported = async (
    resources: IPostProcessedResourceFileForImport[]
  ) => {
    return resources;
  };

  beforePreviewResourceBinaryDelivered = () => null;

  beforePreviewResourceMetadataDelivered = () => null;

  generateThumbnail = () => null;
}
