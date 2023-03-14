import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { GridTable, IColumnConfig } from 'components/GridTable/GridTable';

import { server } from 'utils/rpc';
import type { IStorage } from 'rpc/query';

import { StorageKey } from './StorageKey';
import { parseStorageKey, StorageType } from '../utils/parseStorageKey';
import { MetadataGroupTable } from './MetadataGroupTable';

export interface IStorageListActionProps {
  id: string;
}

export interface IPermissionListProps {
  groupIndex: number;
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

const TYPES = [
  StorageType.Database,
  StorageType.Code,
  StorageType.Metadata,
  StorageType.Unknown,
];

export const StorageList: React.FC<IPermissionListProps> = ({
  groupIndex,
  Actions,
}) => {
  const [storages, storagesActions] = useAsync(() => {
    return server.getStorages();
  });

  React.useEffect(() => {
    void storagesActions.execute();
  }, [storagesActions]);

  const { rawData, metadataMap } = React.useMemo(() => {
    const internalMetadataMap = new Map<string, IStorage[]>();
    const internalRawData = storages.result?.map((storage) => {
      const parsedKey = parseStorageKey(storage.key, storage.comment);

      if (parsedKey.type === StorageType.Metadata) {
        const { seriesId, releaseId } = parsedKey;

        const groupKey = `${seriesId}:::${releaseId}`;

        const value = internalMetadataMap.get(groupKey) ?? ([] as IStorage[]);
        value.push(storage);
        internalMetadataMap.set(groupKey, value);
      }

      return {
        id: storage.key,
        key: storage.key,
        formattedKey: (
          <StorageKey
            key={storage.key}
            id={storage.key}
            storageKey={storage.key}
            comment={storage.comment}
          />
        ),
        permissions: `${storage.need_permission_count}/${
          storage.need_permissions?.length ?? 0
        }`,
        notes: storage.comment,
        parsedKey,
      };
    });

    return { rawData: internalRawData, metadataMap: internalMetadataMap };
  }, [storages.result]);

  const filteredData = React.useMemo(() => {
    return rawData?.filter((x) => x.parsedKey.type === TYPES[groupIndex]);
  }, [groupIndex, rawData]);

  if (groupIndex === 2) {
    return (
      <MetadataGroupTable
        metadataGroup={metadataMap}
        onRefreshEpisodeListRequest={storagesActions.execute}
      />
    );
  }

  return (
    <GridTable
      columns={columnConfigs}
      Actions={Actions}
      data={filteredData}
      loading={storages.status === 'loading'}
      emptyHeader="No storage"
      emptyContent="Creating new storage by uploading data archives."
    />
  );
};
