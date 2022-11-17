import { WorkspaceLockedError } from '@recative/definitions';
import { LokiStreamedFsAdapter } from './LokiFsStreamedAdapter';

import { ifDbLocked } from '../rpc/query/lock';

export class LokiWorkspaceLockSafeFsAdapter extends LokiStreamedFsAdapter {
  exportDatabase = async (
    databaseName: string,
    dbref: object,
    callback: (x: Error | null) => void
  ) => {
    if (await ifDbLocked()) {
      throw new WorkspaceLockedError();
    }

    super.exportDatabase(databaseName, dbref, callback);
  };
}
