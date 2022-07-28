/* eslint-disable no-restricted-syntax */
import { glob } from 'glob';
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

export const archiverGlob = (output: string, globStr: string, cwd?: string) => {
  const outputStream = createWriteStream(output);

  const archive = originalArchiver('zip', {
    zlib: { level: 9 },
  });

  const files = glob.sync(globStr, { cwd });

  const promise = new Promise((resolve, reject) => {
    archive.on('error', (err) => {
      reject(err);
    });

    outputStream.on('end', () => {
      resolve(true);
    });

    archive.glob(globStr, { cwd });

    archive.pipe(outputStream);

    archive
      .finalize()
      .then(() => {
        resolve(true);
        return true;
      })
      .catch((error) => {
        reject(error);
      });
  });

  return { files, promise, archive };
};
