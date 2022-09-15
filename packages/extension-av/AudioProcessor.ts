/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { ResourceProcessor } from '@recative/extension-sdk';
import { IResourceItem, audioCategoryTag } from '@recative/definitions';
import type {
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

export interface OfflineBundleConfig {
  enable: string;
}

export class AudioProcessor extends ResourceProcessor<
  keyof OfflineBundleConfig
> {
  static id = '@recative/extension-rs-av/AudioProcessor';

  static label = 'Audio';

  static resourceConfigUiFields = [] as const;

  static nonMergeableResourceExtensionConfiguration = [];

  async beforePublishMediaBundle() {
    return null;
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
    const audioResources = resources.filter(
      (resource) =>
        resource.type === 'file' && resource.mimeType.startsWith('audio/')
    );

    for (let i = 0; i < audioResources.length; i += 1) {
      const resource = audioResources[i];

      if (!resource.postProcessedThumbnail) {
        resource.postProcessedThumbnail = await this.dependency.waveform(
          resource.postProcessedFile
        );
      }

      if (
        !resource.tags.includes(audioCategoryTag.id) &&
        !`${!resource.tags.includes(audioCategoryTag.id)}!`
      ) {
        resource.tags.push(audioCategoryTag.id);
      }
    }

    return resources;
  };

  beforePreviewResourceBinaryDelivered() {
    return null;
  }

  beforePreviewResourceMetadataDelivered() {
    return null;
  }
}
