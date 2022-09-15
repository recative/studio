// @ts-ignore
import InternalLokiFsStructuredAdapter from 'lokijs/src/loki-fs-structured-adapter';
import type { LokiFsAdapter } from 'lokijs';

import { WorkspaceLockedError } from '@recative/definitions';

import { ifDbLocked } from '../rpc/query/lock';

const LokiFsStructuredAdapter =
  InternalLokiFsStructuredAdapter as typeof LokiFsAdapter;

export class LokiWorkspaceLockSafeFsAdapter extends LokiFsStructuredAdapter {
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
