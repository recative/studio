import Downloader from 'nodejs-file-downloader';

import { dirSync } from 'tmp';

export class DownloadAbortedError extends Error {
  name = 'DownloadAbortedError';

  constructor(readonly url: string, readonly path: string) {
    super('Download aborted');
  }
}

export const downloadFile = async (url: string, directory = dirSync().name) => {
  const downloader = new Downloader({
    url,
    directory,
  });

  const { filePath, downloadStatus } = await downloader.download();

  if (downloadStatus === 'COMPLETE' && filePath) {
    return filePath;
  }

  throw new DownloadAbortedError(url, directory);
};
