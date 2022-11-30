/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { ResourceProcessor } from '@recative/extension-sdk';
import { IResourceItem, imageCategoryTag } from '@recative/definitions';
import type {
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

export class TextureProcessor extends ResourceProcessor<''> {
  static id = '@recative/extension-rs-texture/TextureProcessor';

  static label = 'Texture';

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
    return resources;
  };

  beforeFileImported = async (
    resources: IPostProcessedResourceFileForImport[]
  ) => {
    const imageResources = resources.filter(
      (resource) =>
        resource.type === 'file' && resource.mimeType.startsWith('image/')
    );

    for (let i = 0; i < imageResources.length; i += 1) {
      const resource = imageResources[i];

      if (!resource.postProcessedThumbnail) {
        resource.postProcessedThumbnail = await this.dependency.imageThumbnail(
          resource.postProcessedFile
        );
      }

      if (
        !resource.tags.includes(imageCategoryTag.id) &&
        `${!resource.tags.includes(imageCategoryTag.id)}!`
      ) {
        resource.tags.push(imageCategoryTag.id);
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
