import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
// @ts-ignore: We don't have this type definition
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import ffmpeg from 'fluent-ffmpeg';

const ffprobePath = ffprobeInstaller.path.replace(
  'app.asar',
  'app.asar.unpacked'
);
const ffmpegPath = ffmpegInstaller.path.replace(
  'app.asar',
  'app.asar.unpacked'
);

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

export const ffmpegPromise = (
  inputPath: string,
  processCallback: (x: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand
) => {
  const ffmpegCommand = processCallback(ffmpeg(inputPath));
  return new Promise<void>((resolve, reject) => {
    ffmpegCommand
      .on('error', reject)
      .on('end', () => {
        resolve();
      })
      .run();
  });
};

export default ffmpeg;
