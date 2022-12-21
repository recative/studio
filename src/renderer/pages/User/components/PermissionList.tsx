import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { server } from 'utils/rpc';
import { GridTable, IColumnConfig } from 'components/GridTable/GridTable';

export interface IPermissionListActionsProps {
  id: string;
}

export interface IPermissionListProps {
  Actions?: React.FC<IPermissionListActionsProps>;
}

const permissionKeys = ['index', 'notes'] as const;

const columnConfigs: IColumnConfig<PermissionKeys>[] = [
  {
    id: 'index',
    order: 0,
    width: 'max-content',
    content: 'ID',
  },
  {
    id: 'notes',
    order: 1,
    width: 'auto',
    content: 'Notes',
  },
];

type PermissionKeys = typeof permissionKeys[number];

export const PermissionList: React.FC<IPermissionListProps> = ({ Actions }) => {
  const [permissions, permissionsActions] = useAsync(() => {
    return server.getPermissions();
  });

  React.useEffect(() => {
    permissionsActions.execute();
  }, [permissionsActions]);

  const data = React.useMemo(
    () =>
      permissions.result?.map((permission) => ({
        id: permission.id,
        index: permission.id,
        notes: permission.comment,
      })),
    [permissions.result]
  );

  return (
    <GridTable
      columns={columnConfigs}
      Actions={Actions}
      data={data}
      emptyHeader="No permission"
      emptyContent="Creating new permission entries by synchronizing the episode list or manually adding one."
    />
  );
};
