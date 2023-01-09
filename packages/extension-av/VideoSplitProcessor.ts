/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import {
  videoCategoryTag,
  audioCategoryTag,
  videoRoleResourceTag,
  audioRoleResourceTag,
  videoGroupResourceTag,
} from '@recative/definitions';
import {
  ffmpeg,
  ResourceGroupForImport,
  ResourceProcessor,
  ResourceFileForImport,
} from '@recative/extension-sdk';
import type {
  PostProcessedResourceItemForImport,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

export interface OfflineBundleConfig {
  enable: string;
}

export class VideoSplitProcessor extends ResourceProcessor<
  keyof OfflineBundleConfig
> {
  static id = '@recative/extension-rs-av/VideoSplitProcessor';

  static label = 'Video Split';

  static resourceConfigUiFields = [] as const;

  static nonMergeableResourceExtensionConfiguration = [];

  async beforePublishMediaBundle() {
    return null;
  }

  afterGroupCreated() {
    return null;
  }

  beforePublishApplicationBundle = async () => {
    return null;
  };

  beforeFileImported = async (
    resources: PostProcessedResourceItemForImport[]
  ) => {
    const videoResources = resources.filter(
      (resource) =>
        resource.type === 'file' && resource.mimeType.startsWith('video/')
    ) as IPostProcessedResourceFileForImport[];

    for (let i = 0; i < videoResources.length; i += 1) {
      const videoResource = videoResources[i];

      videoResource.tags.push('custom:raw!');
      const metadata = await this.dependency.ffprobe(
        videoResource.postProcessedFile
      );

      const resourceGroup = new ResourceGroupForImport();

      resourceGroup.definition.tags.push(videoGroupResourceTag.id);

      const videoStream = metadata.streams.find(
        (x) => x.codec_type === 'video'
      );
      const audioStream = metadata.streams.find(
        (x) => x.codec_type === 'audio'
      );
      const resultFormat = metadata.format.format_name?.split(',')[0] || 'mp4';
      const duration = metadata.format.duration || null;

      const hasVideoStream = !!videoStream;
      const hasAudioStream = !!audioStream;

      if (hasVideoStream) {
        const videoFile = new ResourceFileForImport();

        await videoFile.addFile(
          await ffmpeg(videoResource.postProcessedFile, (x) =>
            x.noAudio().videoCodec('copy').outputFormat(resultFormat)
          )
        );

        videoFile.definition.label = `${videoResource.label} - Video Channel`;

        videoFile.definition.managedBy = videoResource.id;
        videoFile.definition.originalHash = videoResource.originalHash;
        videoFile.definition.tags = [
          `${videoRoleResourceTag.id}!`,
          `${videoCategoryTag.id}!`,
        ];
        videoFile.definition.duration = duration;
        videoFile.definition.postProcessedThumbnail =
          await this.dependency.screenshot(
            videoFile.definition.postProcessedFile
          );

        videoResource.postProcessedThumbnail =
          videoFile.definition.postProcessedThumbnail;

        videoFile.addToGroup(resourceGroup);

        resources.push(await videoFile.finalize());
      }

      if (hasAudioStream) {
        const audioFile = new ResourceFileForImport();

        await audioFile.addFile(
          await ffmpeg(videoResource.postProcessedFile, (x) =>
            x.noVideo().audioCodec('copy').outputFormat(resultFormat)
          )
        );

        audioFile.definition.label = `${videoResource.label} - Audio Channel`;

        audioFile.definition.managedBy = videoResource.id;
        audioFile.definition.originalHash = videoResource.originalHash;
        audioFile.definition.tags = [
          `${audioRoleResourceTag.id}!`,
          `${audioCategoryTag.id}!`,
        ];
        audioFile.definition.duration = duration;
        audioFile.definition.postProcessedThumbnail =
          await this.dependency.waveform(
            audioFile.definition.postProcessedFile
          );
        audioFile.addToGroup(resourceGroup);

        await audioFile.updateMimeType();

        if (audioFile.definition.mimeType.startsWith('video')) {
          audioFile.definition.mimeType = 'audio/unknown';
        }

        resources.push(await audioFile.finalize());
      }

      if (hasVideoStream || hasAudioStream) {
        resourceGroup.addFile(videoResource);
        resourceGroup.definition.label = videoResource.label;
        videoResource.tags = videoResource.tags.filter(
          (x) => x !== videoCategoryTag.id
        );

        videoResource.tags.push(`${videoCategoryTag.id}!`);

        resources.push(resourceGroup.finalize());
      }
    }

    return resources;
  };

  beforePreviewResourceBinaryDelivered = () => null;

  beforePreviewResourceMetadataDelivered = () => null;

  generateThumbnail = () => null;
}
