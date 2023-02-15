import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { GridTable, IColumnConfig } from 'components/GridTable/GridTable';

import { server } from 'utils/rpc';

import { StorageKey } from './StorageKey';

export interface IStorageListActionProps {
  id: string;
}

export interface IPermissionListProps {
  Actions?: React.FC<IStorageListActionProps>;
}

const storageKeys = ['formattedKey', 'permissions', 'notes'] as const;

const columnConfigs: IColumnConfig<TokenKeys>[] = [
  {
    id: 'formattedKey',
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
    id: 'notes',
    order: 3,
    width: 'auto',
    content: 'Notes',
  },
];

type TokenKeys = typeof storageKeys[number];

export const StorageList: React.FC<IPermissionListProps> = ({ Actions }) => {
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
        formattedKey: (
          <StorageKey
            id={storage.key}
            key={storage.key}
            comment={storage.comment}
          />
        ),
        permissions: `${storage.need_permission_count}/${
          storage.need_permissions?.length ?? 0
        }`,
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
