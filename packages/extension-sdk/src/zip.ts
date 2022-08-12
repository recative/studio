/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
import StreamZip from 'node-stream-zip';

import { glob } from 'glob';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import type { QueueObject } from 'async';

import originalArchiver from 'archiver';

import type { WriteStream } from 'fs';

export interface IPathListItem {
  from: string | ReadableStream | Promise<string | ReadableStream>;
  to: string;
}

export class Zip {
  protected outputStream: WriteStream;

  // We use an internal member here.
  protected archive: originalArchiver.Archiver & {
    _queue: QueueObject<unknown>;
  };

  protected finished: Promise<null>;

  constructor(
    public readonly filePath: string,
    options: originalArchiver.ArchiverOptions | undefined = {
      zlib: { level: 9 },
    }
  ) {
    this.outputStream = createWriteStream(filePath);
    this.archive = originalArchiver(
      'zip',
      options
    ) as unknown as typeof this.archive;

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

  waitForDrain = <T>(x: T) => {
    return new Promise<T>((resolve, reject) => {
      this.archive.once('error', (err) => {
        reject(err);
      });

      this.outputStream.once('end', () => {
        resolve(x);
      });

      this.archive._queue.drain(() => resolve(x));
    });
  };

  appendFile = (from: string | Buffer, to: string) => {
    const drainPromise = this.waitForDrain(null);
    this.archive.append(from, { name: to });

    return drainPromise;
  };

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
    const drainPromise = this.waitForDrain(null);
    this.archive.directory(from, to);

    return drainPromise;
  };

  appendGlob = (globStr: string, cwd?: string) => {
    const files = glob.sync(globStr, { cwd });

    const drainPromise = this.waitForDrain(files);
    this.archive.glob(globStr, { cwd });

    return drainPromise;
  };

  transfer = async (
    fromZip: string,
    from: string | null = null,
    to: string | null = null,
    exclude: string[] | null = null
  ) => {
    const baseZip = new StreamZip.async({ file: fromZip });
    const baseZipFileList = Object.entries(await baseZip.entries())
      .map(([key, entry]) => {
        if (!entry.isFile) {
          return '';
        }

        if (from && !entry.name.startsWith(from)) {
          return '';
        }

        if (exclude) {
          for (let i = 0; i < exclude.length; i += 1) {
            if (entry.name.startsWith(exclude[i])) {
              return '';
            }
          }
        }

        return key;
      })
      .filter(Boolean)
      .map(async (entryName) => {
        const pathBase = to ? join(to, entryName) : entryName;

        return {
          from: (await baseZip.stream(
            entryName
          )) as unknown as ReadableStream<unknown>,
          to: from ? pathBase.replace(from, '') : pathBase,
        };
      });

    return this.appendFileList(await Promise.all(baseZipFileList));
  };

  done = async () => {
    this.archive.append('yay', { name: '.recative' });
    this.archive.finalize();

    await this.finished;

    return readFile(this.filePath);
  };
}
