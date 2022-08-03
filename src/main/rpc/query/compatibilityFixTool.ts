import fs from 'fs';
import { fileSync } from 'tmp';

import { audioCategoryTag, audioRoleResourceTag } from '@recative/definitions';
import type { IResourceFile } from '@recative/definitions';

import { getDb } from '../db';
import { getMimeType } from '../../utils/getMimeType';
import { ffmpegPromise } from '../../utils/ffmpeg';
import { getResourceFilePath } from '../../utils/getResourceFile';
import { replaceResourceFile } from './resource';

const readFirstNBytes = async (
  path: fs.PathLike,
  n: number
): Promise<Buffer> => {
  const chunks = [];
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of fs.createReadStream(path, { start: 0, end: n })) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

/*
 * Check first three or two bytes of the resource file, if is 49, 44, 33 or
 * FF, FB then it is a valid MP3 file.
 */
const checkAudioFileCompatibility = async (resource: IResourceFile) => {
  const resourcePath = getResourceFilePath(resource);
  const firstThreeBytes = await readFirstNBytes(resourcePath, 3);
  const hex = firstThreeBytes.toString('hex');
  return hex.startsWith('494433') || hex.startsWith('fffb');
};

/*
 * Select all audio file from currentDb and filter all files that is not
 * compatible.
 */
const getIncompatibleAudioFiles = async () => {
  const db = await getDb();
  const resources = db.resource.resources.find({
    removed: false,
    tags: { $containsAny: [audioCategoryTag.id, audioRoleResourceTag.id] },
  });

  let totalFiles = 0;

  const checkupResult = await Promise.all(
    resources.map(async (resource) => {
      if (resource.type === 'group') {
        return { ...resource, isCompatible: true };
      }

      totalFiles += 1;

      const resourcePath = getResourceFilePath(resource);
      const mimeType = await getMimeType(resourcePath);

      const isCompatible =
        resource.mimeType.startsWith('audio') &&
        (await checkAudioFileCompatibility(resource)) &&
        mimeType === resource.mimeType;

      return {
        ...resource,
        isCompatible,
      };
    })
  );

  const incompatibleResources = checkupResult.filter((x) => {
    return !x.isCompatible;
  });

  console.log(
    `Found ${incompatibleResources.length} incompatible audio files, ${totalFiles} in total.`
  );

  return incompatibleResources.filter(
    (resource) => resource.isCompatible === false
  );
};

/**
 * Checkout all MIME type of audio files, if inconsistent, make a report.
 */
export const inspectAudioMimeType = async () => {
  console.log('INSPECTING AUDIO MIME');
  const db = await getDb();
  const resources = db.resource.resources.find({
    removed: false,
    tags: { $containsAny: [audioCategoryTag.id, audioRoleResourceTag.id] },
  });

  await Promise.allSettled(
    resources.map(async (resource) => {
      if (resource.type !== 'file') {
        return null;
      }

      const resourcePath = getResourceFilePath(resource);

      const mimeType = await getMimeType(resourcePath);

      if (mimeType !== resource.mimeType) {
        console.warn(`:: Wrong MIME for ${resource.label}(${resource.id})`);

        (resource as any).mimeType = mimeType;
        resource.url = {};
        db.resource.resources.update(resource);
      }

      return null;
    })
  );
};

/**
 * Backup all audio files that is not compatible with `.backup` suffix,
 * convert it to VBR mp3 with fluent-ffmpeg and then remove the original file.
 */
export const fixIncompatibleAudioFiles = async () => {
  console.log('FIXING AUDIOS');
  const incompatibleResources = await getIncompatibleAudioFiles();

  await Promise.all(
    incompatibleResources.map(async (resource) => {
      const db = await getDb();
      const resourceInDb = db.resource.resources.findOne({
        id: resource.id,
      });

      if (!resourceInDb) {
        throw new TypeError('No file found');
      }

      if (resourceInDb.type !== 'file') {
        throw new TypeError('Resource is a group');
      }

      const resourcePath = getResourceFilePath(resource);
      const outputPath = fileSync({ postfix: '.mp3' });
      outputPath.removeCallback();

      try {
        await ffmpegPromise(resourcePath, (x) =>
          x
            .audioCodec('libmp3lame')
            .audioBitrate(192)
            .outputFormat('mp3')
            .output(outputPath.name)
        );
        replaceResourceFile(outputPath.name, resourceInDb);
        console.log(`Fixed ${resourcePath}`);
      } catch (e) {
        console.log('----------');
        console.log(':: Error, unable to convert the file');
        console.log(`Label: ${resourceInDb.label}(${resourceInDb.id})`);
        console.error(e);
        console.log('----------');
      }
    })
  );
};
