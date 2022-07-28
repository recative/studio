/* eslint-disable no-restricted-syntax */
import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';

import originalArchiver from 'archiver';

import type { WriteStream } from 'fs';

export interface IPathListItem {
  from: string | ReadableStream | Promise<string | ReadableStream>;
  to: string;
}

export class Zip {
  protected outputStream: WriteStream;

  protected archive: originalArchiver.Archiver;

  protected finished: Promise<null>;

  constructor(
    public readonly filePath: string,
    options: originalArchiver.ArchiverOptions | undefined = {
      zlib: { level: 9 },
    }
  ) {
    this.outputStream = createWriteStream(filePath);
    this.archive = originalArchiver('zip', options);

    this.finished = new Promise((resolve) => {
      this.outputStream.on('finish', () => {
        this.outputStream.close();
      });

      this.outputStream.on('close', () => {
        resolve(null);
      });

      this.archive.pipe(this.outputStream);
    });
  }

  appendFileList = (pathListItem: IPathListItem[]) => {
    const promise = new Promise<void>((resolve, reject) => {
      const allTasks: Record<string, boolean> = {};

      pathListItem.forEach((item) => {
        allTasks[item.to] = false;
      });

      const handleError = (err: Error) => {
        reject(err);
      };

      const handleEntry = (entry: originalArchiver.EntryData) => {
        if (entry.name in allTasks) {
          allTasks[entry.name] = true;
        }

        if (Object.values(allTasks).every((x) => x)) {
          this.archive.off('error', handleError);
          this.archive.off('entry', handleEntry);
          resolve();
        }
      };

      this.archive.once('error', handleError);
      this.archive.on('entry', handleEntry);

      pathListItem.map(async ({ from, to }) => {
        const resolvedFrom = await from;
        this.archive.append(
          // @ts-ignore - `readStream` is a readable stream.
          typeof resolvedFrom === 'string' ? createReadStream(from) : from,
          {
            name: to,
          }
        );
      });
    });

    return promise;
  };

  appendDir = (from: string, to: string) => {
    return new Promise<void>((resolve, reject) => {
      this.archive.once('error', (err) => {
        reject(err);
      });

      this.outputStream.once('end', () => {
        resolve();
      });

      this.archive.directory(from, to);
    });
  };

  appendGlob = (globStr: string, cwd?: string) => {
    const files = glob.sync(globStr, { cwd });

    return new Promise<string[]>((resolve, reject) => {
      this.archive.once('error', (err) => {
        reject(err);
      });

      this.outputStream.once('end', () => {
        resolve(files);
      });
      this.archive.glob(globStr, { cwd });
    });
  };

  done = async () => {
    this.archive.append('yay', { name: '.recative' });
    this.archive.finalize();

    await this.finished;

    return readFile(this.filePath);
  };
}
