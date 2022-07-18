import { basename, dirname } from 'path';
import { readFile, writeFile } from 'fs-extra';

import photon from '@silvia-odwyer/photon-node';

import ffmpeg from '../../utils/ffmpeg';

export const generateImageThumbnail = async (
  inputPath: string,
  outputPath: string
) => {
  const file = await readFile(inputPath, { encoding: 'base64' });
  const data = file.replace(/^data:image\/(png|jpg);base64,/, '');

  const image = photon.PhotonImage.new_from_base64(data);
  photon.resize(image, 320, 240, 4);

  const outputBase64 = image
    .get_base64()
    .replace(/^data:image\/\w+;base64,/, '');

  await writeFile(outputPath, outputBase64, { encoding: 'base64' }, (err) => {
    throw err;
  });
};

export const generateVideoThumbnail = (
  inputPath: string,
  outputPath: string
) => {
  return new Promise<void>((resolve, reject) => {
    try {
      ffmpeg(inputPath).screenshot({
        count: 1,
        size: '320x240',
        folder: dirname(outputPath),
        filename: basename(outputPath),
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

export const generateAudioThumbnail = (
  inputPath: string,
  outputPath: string
) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .complexFilter(['showwavespic=s=320x240:colors=black'])
      .output(outputPath)
      .on('error', reject)
      .on('end', resolve)
      .on('start', (commandLine) =>
        console.log(`Executing ffmpeg command: ${commandLine}`)
      )
      .run();
  });
};

export const generateBase64Thumbnail = async (
  base64: string,
  outputPath: string
) => {
  await writeFile(
    outputPath,
    base64.replace(/^data:.+;base64,/, ''),
    { encoding: 'base64' },
    (err) => {
      throw err;
    }
  );
};

export const getThumbnailFileName = (id: string) => `${id}-thumbnail.png`;
