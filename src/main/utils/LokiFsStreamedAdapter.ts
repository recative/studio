import fs from 'fs';
import { Readable } from 'stream';
import { stat, move, remove } from 'fs-extra';

import Assembler from 'stream-json/Assembler';

import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { stringer } from 'stream-json/Stringer';
import { disassembler } from 'stream-json/Disassembler';

const wrapError = (x: unknown) =>
  x instanceof Error ? x : new Error(String(x));

export class LokiStreamedFsAdapter {
  mode = 'reference';

  loadDatabase = async (dbName: string, callback: (x: unknown) => void) => {
    try {
      const stats = await stat(dbName);

      if (stats.isDirectory()) {
        throw new TypeError(`database is a directory, this is not allowed`);
      }

      if (!stats.isFile()) {
        return callback(null);
      }

      const pipeline = chain([fs.createReadStream(dbName), parser()]);

      const assembler = Assembler.connectTo(pipeline);

      assembler.on('done', (asm) => {
        callback(asm.current);
      });
    } catch (error) {
      callback(wrapError(error));
    }

    return null;
  };

  exportDatabase = async (
    dbName: string,
    dbReference: object,
    callback: (x: Error | null) => void
  ) => {
    const tmpDbName = `${dbName}~`;
    try {
      await remove(tmpDbName);

      const writeStream = fs.createWriteStream(tmpDbName);

      const source = new Readable({
        objectMode: true,
      });

      source.push(dbReference);
      source.push(null);

      const nextPipeline = chain(
        [source, disassembler(), stringer(), writeStream],
        {}
      );

      writeStream.on('close', async () => {
        await remove(dbName);
        await move(tmpDbName, dbName);
        await remove(tmpDbName);
        callback(null);
      });
      writeStream.on('error', (error) => callback(wrapError(error)));
      nextPipeline.on('error', (error) => callback(wrapError(error)));
    } catch (error) {
      callback(wrapError(error));
    }
  };
}
