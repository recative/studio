import { nanoid } from 'nanoid';
import { join as joinPath, basename } from 'path';

import {
  videoCategoryTag,
  audioCategoryTag,
  videoRoleResourceTag,
  audioRoleResourceTag,
  videoGroupResourceTag,
  PreloadLevel,
} from '@recative/definitions';
import type { IResourceFile, IResourceItem } from '@recative/definitions';

import { getMimeType } from '../../utils/getMimeType';
import { getFileHash } from '../../utils/getFileHash';
import { getThumbnailSrc } from '../../utils/getThumbnailSrc';
import ffmpeg, { ffmpegPromise } from '../../utils/ffmpeg';

import {
  generateVideoThumbnail,
  generateAudioThumbnail,
  getThumbnailFileName,
} from './thumbnail';

const splitChannel = async (
  inputPath: string,
  outputDirectory: string,
  ffmpegCommand: (x: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand,
  thumbnailGenerator:
    | typeof generateVideoThumbnail
    | typeof generateAudioThumbnail,
  originalHash: string,
  resourceGroupId: string,
  tags: IResourceFile['tags'],
  suffix: string
) => {
  const fileName = basename(inputPath);

  const channelId = nanoid();
  const channelPath = joinPath(outputDirectory, `${channelId}.resource`);
  await ffmpegPromise(inputPath, (x) => ffmpegCommand(x).output(channelPath));

  const videoMime = await getMimeType(channelPath);
  const thumbnailFileName = getThumbnailFileName(channelId);

  await thumbnailGenerator(
    channelPath,
    joinPath(outputDirectory, thumbnailFileName)
  );

  const fileDescription: IResourceFile = {
    type: 'file',
    id: channelId,
    label: `${fileName}-${suffix}`,
    episodeIds: [],
    mimeType: videoMime,
    url: {},
    managedBy: null,
    originalHash,
    convertedHash: await getFileHash({ id: channelId }),
    cacheToHardDisk: false,
    preloadLevel: PreloadLevel.None,
    preloadTriggers: [],
    duration: null,
    removed: false,
    removedTime: -1,
    resourceGroupId,
    tags,
    thumbnailSrc: getThumbnailSrc(thumbnailFileName),
    importTime: Date.now(),
    extensionConfigurations: {},
  };

  return fileDescription;
};

export const preprocessVideo = async (
  inputPath: string,
  outputDirectory: string,
  hash: string
): Promise<IResourceItem[]> => {
  const metadata = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
    ffmpeg(inputPath).ffprobe((err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });

  const fileName = basename(inputPath);
  const resourceGroupId = nanoid();

  const resources: IResourceItem[] = [];

  const videoStream = metadata.streams.find((x) => x.codec_type === 'video');
  const audioStream = metadata.streams.find((x) => x.codec_type === 'audio');
  const resultFormat = metadata.format.format_name?.split(',')[0] || 'mp4';
  const duration = metadata.format.duration || null;

  const hasVideoStream = !!videoStream;
  const hasAudioStream = !!audioStream;

  if (hasVideoStream) {
    const resourceDescription = await splitChannel(
      inputPath,
      outputDirectory,
      (x) => x.noAudio().videoCodec('copy').outputFormat(resultFormat),
      generateVideoThumbnail,
      hash,
      resourceGroupId,
      [videoRoleResourceTag.id, videoCategoryTag.id],
      'video-channel'
    );
    resources.push({ ...resourceDescription, duration });
  }

  if (hasAudioStream) {
    const resourceDescription = await splitChannel(
      inputPath,
      outputDirectory,
      (x) => x.noVideo().audioCodec('copy').outputFormat(resultFormat),
      generateAudioThumbnail,
      hash,
      resourceGroupId,
      [audioRoleResourceTag.id, audioCategoryTag.id],
      'audio-channel'
    );

    if (resourceDescription.mimeType.startsWith('video')) {
      (resourceDescription as any).mimeType = 'audio/unknown';
    }

    resources.push({ ...resourceDescription, duration });
  }

  if (hasVideoStream || hasAudioStream) {
    resources.push({
      type: 'group',
      id: resourceGroupId,
      label: fileName,
      removed: false,
      removedTime: -1,
      thumbnailSrc: resources[0].thumbnailSrc,
      tags: [videoGroupResourceTag.id],
      importTime: Date.now(),
      files: resources.map((x) => x.id),
    });
  }

  return resources;
};
