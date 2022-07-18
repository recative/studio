import { join } from 'path';
import StreamZip from 'node-stream-zip';

import type { Archiver } from 'archiver';

import { archiverAppendPathList } from './archiver';

export const transformFromZip = async (
  archive: Archiver,
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

  return archiverAppendPathList(archive, await Promise.all(baseZipFileList))
    .promise;
};
