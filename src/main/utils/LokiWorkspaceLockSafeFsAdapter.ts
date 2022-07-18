import { LokiFsAdapter } from 'lokijs';

import { WorkspaceLockedError } from '@recative/definitions';

import { ifDbLocked } from '../rpc/query/lock';

export class LokiWorkspaceLockSafeFsAdapter extends LokiFsAdapter {
  async saveDatabase(
    dbName: string,
    dbString: string | Uint8Array,
    callback: (error?: Error | null) => void
  ) {
    if (await ifDbLocked()) {
      throw new WorkspaceLockedError();
    }
    super.saveDatabase(dbName, dbString, callback);
  }

  async deleteDatabase(
    dbName: string,
    callback: (error?: Error | null) => void
  ) {
    if (await ifDbLocked()) {
      throw new WorkspaceLockedError();
    }
    super.deleteDatabase(dbName, callback);
  }
}
