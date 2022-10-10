// @ts-ignore
import InternalLokiFsStructuredAdapter from 'lokijs/src/loki-fs-structured-adapter';
import type { LokiFsAdapter } from 'lokijs';

import { WorkspaceLockedError } from '@recative/definitions';

import { ifDbLocked } from '../rpc/query/lock';

const LokiFsStructuredAdapter =
  InternalLokiFsStructuredAdapter as typeof LokiFsAdapter;

export class LokiWorkspaceLockSafeFsAdapter extends LokiFsStructuredAdapter {
  exportDatabase = async (
    databaseName: string,
    dbref: Loki,
    callback: (x: null) => void
  ) => {
    if (await ifDbLocked()) {
      throw new WorkspaceLockedError();
    }

    // @ts-ignore
    super.exportDatabase(databaseName, dbref, callback);
  };
}
