/* eslint-disable no-restricted-syntax */
/* eslint-disable no-labels */
/* eslint-disable no-await-in-loop */
import {
  PostProcessedResourceItemForImport,
  ResourceFileForImport,
  ResourceProcessor,
} from '@recative/extension-sdk';

import { IResourceItem, audioCategoryTag } from '@recative/definitions';
import type {
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

export interface OfflineBundleConfig {
  enable: string;
}

export class AudioCompatibilityProcessor extends ResourceProcessor<
  keyof OfflineBundleConfig
> {
  static id = '@recative/extension-rs-av/AudioCompatibilityProcessor';

  static label = 'Audio Compatibility';

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

  private readFirstNBytes = async (
    buffer: Buffer,
    n: number
  ): Promise<Buffer> => {
    return buffer.subarray(0, n);
  };

  /*
   * Check first three or two bytes of the resource file, if is 49, 44, 33 or
   * FF, FB then it is a valid MP3 file.
   */
  checkAudioFileCompatibility = async (x: Buffer) => {
    const firstThreeBytes = await this.readFirstNBytes(x, 3);
    const hex = firstThreeBytes.toString('hex');
    return hex.startsWith('494433') || hex.startsWith('fffb');
  };

  beforePublishApplicationBundle(
    resources: (PostProcessedResourceItemForUpload | IResourceItem)[]
  ) {
    return resources;
  }

  beforeFileImported = async (
    resources: PostProcessedResourceItemForImport[]
  ) => {
    const audioResources = resources.filter(
      (resource) =>
        resource.type === 'file' && resource.mimeType.startsWith('audio/')
    ) as IPostProcessedResourceFileForImport[];

    for (let i = 0; i < audioResources.length; i += 1) {
      const rawResource = audioResources[i];
      const resource = new ResourceFileForImport(rawResource);

      const compatible = await this.checkAudioFileCompatibility(
        await resource.getFileBuffer()
      );

      const inspectedMimeType = await resource.inspectMimeType();

      const isCompatible =
        resource.definition.mimeType.startsWith('audio/') &&
        compatible &&
        inspectedMimeType === resource.definition.mimeType &&
        resource.definition.mimeType !== 'audio/unknown';

      if (isCompatible) continue;

      const convertedResource = new ResourceFileForImport();
      await convertedResource.cloneFrom(resource);
      convertedResource.definition.tags = [...rawResource.tags];
      convertedResource.definition.label = `${convertedResource.definition.label} - Fixed`;
      convertedResource.definition.mimeType = '';

      if (convertedResource.definition.resourceGroupId) {
        const resourceGroup = resources.find(
          (x) => x.id === resource.definition.resourceGroupId
        );

        if (!resourceGroup) {
          throw new TypeError(`Resource group not found`);
        }

        if (resourceGroup.type !== 'group') {
          throw new TypeError(`Resource group is not a group`);
        }

        resourceGroup.files.push(convertedResource.definition.id);
      }

      if (
        !convertedResource.definition.tags.includes(audioCategoryTag.id) &&
        !`${!convertedResource.definition.tags.includes(audioCategoryTag.id)}!`
      ) {
        convertedResource.definition.tags.push(audioCategoryTag.id);
      }

      await convertedResource.addFile(
        await this.dependency.ffmpeg(
          resource.definition.postProcessedFile,
          (x) => {
            return x
              .audioCodec('libmp3lame')
              .audioBitrate(192)
              .outputFormat('mp3');
          }
        )
      );

      await convertedResource.updateMimeType();
      convertedResource.definition.managedBy = resource.definition.id;

      rawResource.tags.push(`custom:raw!`);

      convertedResource.definition.postProcessedThumbnail =
        rawResource.postProcessedThumbnail;
      resources.push(await convertedResource.finalize());
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
