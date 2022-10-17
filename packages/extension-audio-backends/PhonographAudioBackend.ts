/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { IResourceItem } from '@recative/definitions';
import { ResourceProcessor } from '@recative/extension-sdk';
import type {
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

export class PhonographAudioBackend extends ResourceProcessor<''> {
  static id = '@recative/extension-audio-backends/PhonographAudioBackend';

  static label = 'Audio backends';

  static resourceConfigUiFields = [
    {
      id: 'backend',
      type: 'boolean',
      label: 'Alternative audio backend',
      title: 'Enable Phonograph backend',
    },
  ] as const;

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
    return resources;
  };

  beforeFileImported = async (
    resources: IPostProcessedResourceFileForImport[]
  ) => {
    return resources;
  };

  beforePreviewResourceBinaryDelivered() {
    return null;
  }

  beforePreviewResourceMetadataDelivered() {
    return null;
  }
}
