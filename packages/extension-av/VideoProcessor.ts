import { ResourceProcessor, Writable } from '@recative/extension-sdk';
import {
  IResourceItem,
  IResourceFile,
  IResourceGroup,
  videoCategoryTag,
  videoRoleResourceTag,
  videoGroupResourceTag,
} from '@recative/definitions';
import type {
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

export interface OfflineBundleConfig {
  enable: string;
}

export class VideoProcessor extends ResourceProcessor<
  keyof OfflineBundleConfig
> {
  static id = '@recative/extension-rs-av/VideoProcessor';

  static label = 'Video';

  static resourceConfigUiFields = [] as const;

  static nonMergeableResourceExtensionConfiguration = [];

  async beforePublishMediaBundle(
    resources: IPostProcessedResourceFileForUpload[]
  ) {
    return resources;
  }

  afterGroupCreated(
    files: (IResourceFile | IPostProcessedResourceFileForImport)[],
    newGroup: IResourceGroup
  ) {
    if (
      newGroup.tags.includes(videoGroupResourceTag.id) ||
      `${newGroup.tags.includes(videoGroupResourceTag.id)}!`
    ) {
      const videoFile = files.find(
        (x) =>
          'thumbnailSrc' in x &&
          !('postProcessedThumbnail' in x) &&
          !('postProcessedFile' in x) &&
          (x.tags.includes(videoCategoryTag.id) ||
            x.tags.includes(`${videoCategoryTag.id}!`) ||
            x.tags.includes(videoRoleResourceTag.id) ||
            x.tags.includes(`${videoRoleResourceTag.id}!`))
      ) as IResourceFile | undefined;

      if (!videoFile) return null;
      if (!('thumbnailSrc' in videoFile)) return null;
      (newGroup as Writable<IResourceGroup>).thumbnailSrc =
        videoFile.thumbnailSrc;

      return {
        group: newGroup,
        files,
      };
    }
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
