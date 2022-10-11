/*
  Loki (node) fs structured Adapter.

  This adapter will save database container and each collection to separate 
  files and save collection only if it is dirty.  It is also designed to use a
  destructured serialization method intended to lower the memory overhead of
  json serialization.
  
  This adapter utilizes ES6 generator/iterator functionality to stream output
  and uses node `readline` module to stream input.  This should lower memory
  pressure in addition to individual object serializations rather than loki's
  default deep object serialization.
*/

import fs, { ReadStream } from 'fs';
import stream, { Writable } from 'stream';
import readline from 'readline';

import Loki from 'lokijs';

interface IGenerateDestructuredIOption {
  /**
   * Can be used to only output an individual collection or db (-1)
   */
  partition: number;
}

export class DatabaseReferenceNotAvailableError extends Error {
  name = 'DatabaseReferenceNotAvailableError';

  constructor(task: string) {
    super(`Database not initialized while trying to ${task}`);
  }
}

export class LokiFsStructuredAdapter {
  mode = 'reference';

  dbref: Loki | null = null;

  dirtyPartitions = [];

  /**
   * Loki structured (node) filesystem adapter class.
   * This class fulfills the loki 'reference' abstract adapter interface which can
   *  be applied to other storage methods.
   *
   * @constructor LokiFsStructuredAdapter
   *
   */
  constructor() {
    this.generateDestructured = this.generateDestructured.bind(this);
    this.getPartition = this.getPartition.bind(this);
  }

  /**
   * Generator for constructing lines for file streaming output of db container
   * or collection.
   *
   * @param options - output format options for use externally to loki
   *
   * @returns {string|array} A custom, restructured aggregation of independent serializations.
   */
  *generateDestructured(options: Partial<IGenerateDestructuredIOption> = {}) {
    let index;
    let dbCopy;

    if (!this.dbref) {
      throw new DatabaseReferenceNotAvailableError('generateDestructured');
    }

    const partition = options.partition ?? -1;

    // if partition is -1 we will return database container with no data
    if (partition === -1) {
      // instantiate lightweight clone and remove its collection data
      dbCopy = this.dbref.copy();

      for (index = 0; index < dbCopy.collections.length; index += 1) {
        dbCopy.collections[index].data = [];
      }

      yield dbCopy.serialize({
        serializationMethod: 'normal',
      });

      return;
    }

    // 'partitioned' along with 'partition' of 0 or greater is a request for
    // single collection serialization
    if (partition >= 0) {
      const docCount = this.dbref.collections[partition].data.length;

      for (let docIndex = 0; docIndex < docCount; docIndex += 1) {
        yield JSON.stringify(this.dbref.collections[partition].data[docIndex]);
      }
    }
  }

  /**
   * Loki persistence adapter interface function which outputs un-prototype db
   * object reference to load from.
   *
   * @param databaseName - the name of the database to retrieve.
   * @param callback - callback should accept string param containing
   * db object reference.
   */
  loadDatabase = (
    databaseName: string,
    callback: (x: null | Loki | Error | unknown) => void
  ) => {
    this.dbref = null;

    // make sure file exists
    fs.stat(databaseName, (fileError, stats) => {
      let jsonError: unknown | undefined;

      if (fileError) {
        if (fileError.code === 'ENOENT') {
          // file does not exist, so callback with null
          callback(null);
          return;
        }

        // some other file system error.
        callback(fileError);
        return;
      }
      if (!stats.isFile()) {
        // something exists at this path but it isn't a file.
        callback(new TypeError(`${databaseName} is not a valid file.`));
        return;
      }

      const inputStream = fs.createReadStream(databaseName);
      const outputStream = new stream.Writable();
      const lineReader = readline.createInterface(inputStream, outputStream);

      // first, load db container component
      lineReader.on('line', (line) => {
        // it should single JSON object (a one line file)
        if (this.dbref === null && line !== '') {
          try {
            this.dbref = JSON.parse(line);
          } catch (e) {
            jsonError = e;
          }
        }
      });

      // when that is done, examine its collection array to sequence loading
      // each
      lineReader.on('close', () => {
        if (jsonError) {
          // a json error was encountered reading the container file.
          callback(jsonError);
        } else if (!this.dbref || !this.dbref.collections.length) {
          callback(this.dbref);
        } else if (this.dbref.collections.length > 0) {
          this.loadNextCollection(databaseName, 0, () => {
            callback(this.dbref);
          });
        } else {
          callback(new Error('Unexpected lineReader finish condition branch'));
        }
      });
    });
  };

  /**
   * Recursive function to chain loading of each collection one at a time.
   * If at some point i can determine how to make async driven generator, this
   * may be converted to generator.
   *
   * @param databaseName - the name to give the serialized database
   * within the catalog.
   * @param collectionIndex - the ordinal position of the collection to
   * load.
   * @param callback - callback to pass to next invocation or to call
   * when done.
   */
  loadNextCollection = (
    databaseName: string,
    collectionIndex: number,
    callback: (x?: unknown) => void
  ) => {
    const fileName = `${databaseName}.${collectionIndex}`;

    let internalCollectionIndex = collectionIndex;

    const finalize = () => {
      if (!this.dbref) {
        throw new DatabaseReferenceNotAvailableError('finalizeCollection');
      }

      internalCollectionIndex += 1;
      // if there are more collections, load the next one
      if (internalCollectionIndex < this.dbref.collections.length) {
        this.loadNextCollection(databaseName, collectionIndex, callback);
      }
      // otherwise we are done, callback to loadDatabase so it can return the
      // new db object representation.
      else {
        callback();
      }
    };

    if (!fs.existsSync(fileName)) {
      // File does not exists, this may happen when the collection
      // is created but no data update happened after that, for this
      // case, we should skip reading the file and finalize the database.
      return finalize();
    }

    let inputStream: ReadStream | null = fs.createReadStream(fileName);
    let outputStream: Writable | null = new stream.Writable();
    let lineReader: readline.Interface | null = readline.createInterface(
      inputStream,
      outputStream
    );
    let data: unknown;

    lineReader.on('line', (line) => {
      if (!this.dbref) {
        throw new DatabaseReferenceNotAvailableError(
          'loadNextCollectionReadLine'
        );
      }

      if (line !== '') {
        try {
          const parsedLine = JSON.parse(line);
          if (parsedLine.$loki === undefined) {
            // eslint-disable-next-line no-console
            console.warn('Invalid resource entry, will skip.');
            return;
          }

          data = parsedLine;
        } catch (e) {
          callback(e);
        }
        this.dbref.collections[collectionIndex].data.push(data);
      }
    });

    lineReader.on('close', () => {
      inputStream = null;
      outputStream = null;
      lineReader = null;
      data = null;

      return finalize();
    });

    return null;
  };

  /**
   * Generator for yielding sequence of dirty partition indices to iterate.
   */
  *getPartition() {
    if (!this.dbref) {
      throw new DatabaseReferenceNotAvailableError('getPartition');
    }

    const collectionCount = this.dbref.collections.length;

    // since database container (partition -1) doesn't have dirty flag at db
    // level, always save
    yield -1;

    // yield list of dirty partitions for iteration
    for (let idx = 0; idx < collectionCount; idx += 1) {
      if (this.dbref.collections[idx]?.dirty) {
        yield idx;
      }
    }
  }

  /**
   * Loki reference adapter interface function.  Saves structured json via loki
   * database object reference.
   *
   * @param databaseName - the name to give the serialized database within the
   * catalog.
   * @param dbref - the loki database object reference to save.
   * @param callback - callback passed obj.success with true or false
   */

  exportDatabase = (
    databaseName: string,
    dbref: Loki,
    callback: (x: null) => void
  ) => {
    this.dbref = dbref;

    // create (dirty) partition generator/iterator
    const pi = this.getPartition();

    this.saveNextPartition(databaseName, pi, () => {
      callback(null);
    });
  };

  /**
   * Utility method for queueing one save at a time
   */
  saveNextPartition = (
    databaseName: string,
    partition: Generator<number>,
    callback: () => void
  ) => {
    const nextPartition = partition.next();

    if (nextPartition.done) {
      callback();
      return;
    }

    // db container (partition -1) uses just databaseName for filename,
    // otherwise append collection array index to filename
    const filename =
      databaseName +
      (nextPartition.value === -1 ? '' : `.${nextPartition.value}`);

    const writeStream = fs.createWriteStream(filename);
    writeStream.on('close', () => {
      this.saveNextPartition(databaseName, partition, callback);
    });

    const lines = this.generateDestructured({ partition: nextPartition.value });

    // iterate each of the lines generated by generateDestructured()
    for (const outline of lines) {
      writeStream.write(`${outline}\n`);
    }

    writeStream.end();
  };
}
