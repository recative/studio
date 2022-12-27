import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'baseui';

import { server } from 'utils/rpc';
import { GridTable, IColumnConfig } from 'components/GridTable/GridTable';
import { RecativeBlock } from 'components/Block/RecativeBlock';

export interface IStorageListActionProps {
  id: string;
}

export interface IPermissionListProps {
  Actions?: React.FC<IStorageListActionProps>;
}

const storageKeys = ['key', 'permissions', 'permissionCount', 'notes'] as const;

const columnConfigs: IColumnConfig<TokenKeys>[] = [
  {
    id: 'key',
    order: 0,
    width: 'max-content',
    content: 'Key',
  },
  {
    id: 'permissions',
    order: 1,
    width: 'min-content',
    content: 'Permissions',
  },
  {
    id: 'permissionCount',
    order: 2,
    width: 'min-content',
    content: 'Count',
  },
  {
    id: 'notes',
    order: 3,
    width: 'auto',
    content: 'Notes',
  },
];

type TokenKeys = typeof storageKeys[number];

export const StorageList: React.FC<IPermissionListProps> = ({ Actions }) => {
  const [, theme] = useStyletron();
  const [storages, storagesActions] = useAsync(() => {
    return server.getStorages();
  });

  React.useEffect(() => {
    storagesActions.execute();
  }, [storagesActions]);

  const data = React.useMemo(
    () =>
      storages.result?.map((storage) => ({
        id: storage.key,
        key: storage.key,
        permissions: storage.need_permissions?.map((x) => (
          <RecativeBlock
            key={x}
            width="5px"
            height="5px"
            margin="1px"
            borderRadius="50%"
            background={theme.colors.mono600}
            display="inline-block"
            title={x}
          />
        )),
        permissionCount: storage.need_permission_count,
        notes: storage.comment,
      })),
    [storages.result]
  );

  return (
    <GridTable
      columns={columnConfigs}
      Actions={Actions}
      data={data}
      loading={storages.status === 'loading'}
      emptyHeader="No storage"
      emptyContent="Creating new storage by uploading data archives."
    />
  );
};
