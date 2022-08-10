/* eslint-disable no-restricted-syntax */
import { createReadStream, createWriteStream } from 'fs';
import originalArchiver from 'archiver';

export interface IPathListItem {
  from: string | ReadableStream | Promise<string | ReadableStream>;
  to: string;
}

export const createEmptyZip = (
  output: string,
  options: originalArchiver.ArchiverOptions | undefined = {
    zlib: { level: 9 },
  }
) => {
  const outputStream = createWriteStream(output);

  const archive = originalArchiver('zip', options);

  const finished = new Promise((resolve) => {
    outputStream.on('finish', () => {
      outputStream.close();
    });

    outputStream.on('close', () => {
      resolve(null);
    });
  });

  archive.pipe(outputStream);

  return { archive, finished };
};

export const archiverAppendPathList = (
  archive: originalArchiver.Archiver,
  pathListItem: IPathListItem[]
) => {
  const promise = new Promise((resolve, reject) => {
    archive.on('error', (err) => {
      reject(err);
    });

    Promise.all(
      pathListItem.map(async ({ from, to }) => {
        const resolvedFrom = await from;
        archive.append(
          // @ts-ignore - `readStream` is a readable stream.
          typeof resolvedFrom === 'string' ? createReadStream(from) : from,
          {
            name: to,
          }
        );
      })
    )
      .then(() => resolve(true))
      .catch(reject);
  });

  return { promise, archive };
};

export const archiverAppendDir = (
  archive: originalArchiver.Archiver,
  from: string,
  to: string
) => {
  const promise = new Promise((resolve, reject) => {
    archive.on('error', (err) => {
      reject(err);
    });
    archive.directory(from, to);

    resolve(true);
  });

  return { promise, archive };
};
