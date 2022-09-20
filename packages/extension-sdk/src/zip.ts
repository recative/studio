/* eslint-disable no-restricted-syntax */
import log from 'electron-log';
// @ts-ignore: It's okay
import ZipWriter from 'zip-stream';
import ZipReader from 'node-stream-zip';

import { glob } from 'glob';
import { Buffer } from 'buffer';
import { promisify } from 'util';
import { join, basename } from 'path';
import { readFile, lstat } from 'fs/promises';
import { createWriteStream, createReadStream } from 'fs';
import { Transform, Stream } from 'stream';

import type { WriteStream } from 'fs';
import type { ZlibOptions } from 'zlib';

interface IZipData {
  name: string;
  comment: string;
  date: string | Date;
  mode: number;
  namePrependSlash: boolean;
  store: boolean;
  type: 'directory' | 'file';
}

export interface IPathListItem {
  from: string | Stream | Buffer | Promise<string | Stream | Buffer>;
  to: string;
}

export interface IZipOption {
  comment: string;
  forceLocalTime: boolean;
  forceZip64: boolean;
  store: boolean;
  zlib: ZlibOptions;
}

export class DuplicatedEntryError extends TypeError {
  name = 'DuplicatedEntryError';

  constructor(public entryId: string) {
    super(`${entryId} is already in the zip file.`);
  }
}

export class Zip {
  protected outputStream: WriteStream;

  readonly entries = new Set<string>();

  // We use an internal member here.
  protected archive: {
    entry: (
      source: Buffer | Stream | string,
      data: Partial<IZipData>,
      callback: (error: Error, entry: IZipData) => void
    ) => void;
    finalize: () => void;
    getBytesWritten: () => number;
  } & Transform;

  protected finished: Promise<null>;

  entry: (
    source: Buffer | Stream | string,
    data: Partial<IZipData>
  ) => Promise<IZipData>;

  writing = false;

  closed = false;

  constructor(
    public readonly filePath: string,
    options: Partial<IZipOption> | undefined = {
      zlib: { level: 9 },
    }
  ) {
    this.outputStream = createWriteStream(filePath);
    this.outputStream.close = () => {
      log.warn('AVOID THIS');
    };

    this.archive = new ZipWriter(options) as unknown as typeof this.archive;
    this.entry = promisify(this.archive.entry).bind(this.archive);

    this.archive.pipe(this.outputStream);

    this.finished = new Promise((resolve) => {
      this.archive.on('finish', () => {
        log.error(`:: [${basename(filePath)}] Archive finish`);
      });

      this.archive.on('end', () => {
        log.log(`:: [${basename(filePath)}] Archive end`);
      });

      this.outputStream.on('finish', () => {
        log.log(`:: [${basename(filePath)}] Stream finish`);
        this.outputStream.end();
      });

      this.outputStream.on('close', () => {
        log.log(
          `:: [${basename(filePath)}] Stream close`,
          this.outputStream.destroyed
        );
        resolve(null);
      });

      this.archive.on('error', (error) => {
        log.error(`:: [${basename(filePath)}] Archive error`, error);
      });

      this.archive.on('close', () => {
        log.error(`:: [${basename(filePath)}] Archive close`);
      });
    });
  }

  private appendToEntrySet = (path: string) => {
    if (this.entries.has(path)) {
      throw new DuplicatedEntryError(path);
    }

    this.entries.add(path);
  };

  appendText = async (text: string, to: string, skipDuplicated: boolean) => {
    if (this.writing) {
      throw new Error('Cannot write new content to zip while writing');
    }

    if (this.closed) {
      throw new Error('Cannot write new content to zip after close');
    }

    try {
      this.appendToEntrySet(to);

      this.writing = true;
      const result = await this.entry(text, { name: to });
      this.writing = false;

      return result;
    } catch (error) {
      if (error instanceof DuplicatedEntryError && skipDuplicated) {
        return Promise.resolve(null);
      }
      throw error;
    }
  };

  appendFile = async (
    from: string | Buffer | Stream,
    to: string,
    skipDuplicated?: boolean
  ) => {
    if (this.writing) {
      throw new Error('Cannot write new content to zip while writing');
    }

    if (this.closed) {
      throw new Error('Cannot write new content to zip after close');
    }

    const writeEntry = async (source: Buffer | Stream) => {
      this.writing = true;
      const result = await this.entry(source, { name: to, type: 'file' });
      this.writing = false;

      return result;
    };

    try {
      this.appendToEntrySet(to);

      if (from instanceof Buffer || from instanceof Stream) {
        return await writeEntry(from);
      }

      const readStream = createReadStream(from);
      return await writeEntry(readStream);
    } catch (error) {
      if (error instanceof DuplicatedEntryError && skipDuplicated) {
        return Promise.resolve(null);
      }
      throw error;
    }
  };

  appendFileList = async (
    pathListItem: IPathListItem[],
    skipDuplicated?: boolean
  ) => {
    const resolvedPathListItem = await Promise.all(
      pathListItem.map(async (item) => {
        const from = await item.from;
        return { ...item, from };
      })
    );

    for (const { from, to } of resolvedPathListItem) {
      const resolvedFrom = from;
      await this.appendFile(resolvedFrom, to, skipDuplicated);
    }

    return pathListItem.length;
  };

  appendGlob = async (
    pattern: string,
    cwd?: string,
    to?: string,
    skipDuplicated?: boolean
  ) => {
    const match = glob.sync(pattern, {
      cwd,
      dot: true,
      stat: true,
    });

    const statedMatch = (
      await Promise.all(
        match.map(async (relativePath) => {
          const fullPath = join(cwd || '', relativePath);
          const stat = await lstat(fullPath);

          return { fullPath, relativePath, stat };
        })
      )
    ).filter((item) => item.stat.isFile());

    for (const { fullPath, relativePath } of statedMatch) {
      const targetPath = join(to || '/', relativePath);
      // eslint-disable-next-line no-await-in-loop
      await this.appendFile(fullPath, targetPath, skipDuplicated);
      // i += 1;
    }

    return match.length;
  };

  appendDir = async (from: string, to: string) => {
    return this.appendGlob('**/*', from, to);
  };

  transfer = async (
    fromZip: string,
    from: string | null = null,
    to: string | null = null,
    exclude: string[] | null = null
  ) => {
    const baseZip = new ZipReader.async({ file: fromZip });
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
          from: await baseZip.stream(entryName),
          to: from ? pathBase.replace(from, '') : pathBase,
        };
      });

    const allFiles = await Promise.all(baseZipFileList);

    log.log(
      `:: [${basename(this.filePath)}] Transfer ${allFiles.length} files...`
    );

    if (!allFiles.length) {
      return null;
    }

    return this.appendFileList(allFiles);
  };

  done = async () => {
    if (this.writing) {
      throw new Error('Writing is not finished, unable to close the file');
    }

    await this.appendText('yay', '.recative', true);

    this.closed = true;

    log.log(`:: [${basename(this.filePath)}] Closing archive`);

    this.archive.finalize();

    await this.finished;

    log.log(
      `:: [${basename(
        this.filePath
      )}] Written ${this.archive.getBytesWritten()} bytes`
    );

    return readFile(this.filePath);
  };
}
