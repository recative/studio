import log from 'electron-log';
import rawFfmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
// @ts-ignore: We don't have this type definition
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

import { fileSync } from 'tmp';
import { dirname, basename } from 'path';

import { getFilePath } from './getFilePath';

const ffprobePath = ffprobeInstaller.path.replace(
  'app.asar',
  'app.asar.unpacked'
);
const ffmpegPath = ffmpegInstaller.path.replace(
  'app.asar',
  'app.asar.unpacked'
);

rawFfmpeg.setFfmpegPath(ffmpegPath);
rawFfmpeg.setFfprobePath(ffprobePath);

export const ffmpeg = async (
  x: string | Buffer,
  processCallback: (
    x: Omit<rawFfmpeg.FfmpegCommand, 'output'>
  ) => rawFfmpeg.FfmpegCommand
): Promise<string> => {
  const inputPath = await getFilePath(x);

  const outputPath = fileSync().name;
  const ffmpegCommand = processCallback(rawFfmpeg(inputPath)).output(
    outputPath
  );

  return new Promise<string>((resolve, reject) => {
    ffmpegCommand
      .on('error', reject)
      .on('end', () => {
        resolve(outputPath);
      })
      .run();
  });
};

export const ffprobe = async (x: string | Buffer) => {
  const inputPath = await getFilePath(x);
  return new Promise<rawFfmpeg.FfprobeData>((resolve, reject) => {
    rawFfmpeg(inputPath).ffprobe((err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

export const screenshot = async (x: string | Buffer) => {
  const inputPath = await getFilePath(x);
  const outputPath = fileSync().name;

  return new Promise<string>((resolve, reject) => {
    try {
      rawFfmpeg(inputPath).screenshot({
        count: 1,
        size: '320x240',
        folder: dirname(outputPath),
        filename: basename(outputPath),
      });
      resolve(outputPath);
    } catch (e) {
      reject(e);
    }
  });
};

export const waveform = async (x: string | Buffer) => {
  const inputPath = await getFilePath(x);
  const outputPath = fileSync().name;

  return new Promise<string>((resolve, reject) => {
    rawFfmpeg(inputPath)
      .complexFilter(['showwavespic=s=320x240:colors=black'])
      .output(outputPath)
      .on('error', reject)
      .on('end', () => resolve(outputPath))
      .on('start', (commandLine) =>
        log.log(`:: Executing ffmpeg command: ${commandLine}`)
      )
      .run();
  });
};
