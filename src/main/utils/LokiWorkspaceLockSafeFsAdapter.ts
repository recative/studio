import { WorkspaceLockedError } from '@recative/definitions';
import { LokiStreamedFsAdapter } from './LokiFsStreamedAdapter';

import { ifDbLocked } from '../rpc/query/lock';

export class LokiWorkspaceLockSafeFsAdapter {
  mode = 'reference';

  streamedAdapter = new LokiStreamedFsAdapter();

  loadDatabase = this.streamedAdapter.loadDatabase;

  exportDatabase = async (
    databaseName: string,
    dbref: object,
    callback: (x: Error | null) => void
  ) => {
    if (await ifDbLocked()) {
      throw new WorkspaceLockedError();
    }

    return this.streamedAdapter.exportDatabase(databaseName, dbref, callback);
  };
}
