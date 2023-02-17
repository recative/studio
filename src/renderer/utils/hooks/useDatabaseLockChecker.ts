import * as React from 'react';

import { useAtom } from 'jotai';
import { useAsync } from '@react-hookz/web';
import { useInterval } from 'react-use';

import { DATABASE_LOCKED, WORKSPACE_CONFIGURATION } from 'stores/ProjectDetail';

import { server } from 'utils/rpc';

export const useDatabaseLockChecker = () => {
  const [workspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);
  const [, setDatabaseLocked] = useAtom(DATABASE_LOCKED);

  const [databaseLockedFromMain, databaseLockedFromMainActions] = useAsync(
    server.ifDbLocked
  );

  React.useEffect(() => {
    setDatabaseLocked(databaseLockedFromMain.result ?? true);
  }, [databaseLockedFromMain.result, setDatabaseLocked]);

  useInterval(
    () => {
      void databaseLockedFromMainActions.execute();
    },
    workspaceConfiguration ? 2000 : null
  );
};

export const useDatabaseLocked = () => {
  const [databaseLocked] = useAtom(DATABASE_LOCKED);

  return databaseLocked;
};
