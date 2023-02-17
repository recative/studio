import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { server } from 'utils/rpc';
import { GridTable, IColumnConfig } from 'components/GridTable/GridTable';

export interface ITokenListActionProps {
  id: string;
}

export interface IPermissionListProps {
  Actions?: React.FC<ITokenListActionProps>;
}

const permissionKeys = ['token', 'notes', 'expiredAt', 'valid'] as const;

const columnConfigs: IColumnConfig<TokenKeys>[] = [
  {
    id: 'token',
    order: 0,
    width: 'max-content',
    content: 'Token',
  },
  {
    id: 'notes',
    order: 1,
    width: 'auto',
    content: 'Notes',
  },
  {
    id: 'expiredAt',
    order: 2,
    width: 'max-content',
    content: 'Expired At',
  },
  {
    id: 'valid',
    order: 3,
    width: 'min-content',
    content: 'Valid',
  },
];

type TokenKeys = typeof permissionKeys[number];

export const TokenList: React.FC<IPermissionListProps> = ({ Actions }) => {
  const [tokens, tokensActions] = useAsync(() => {
    return server.getTokens();
  });

  React.useEffect(() => {
    void tokensActions.execute();
  }, [tokensActions]);

  const data = React.useMemo(
    () =>
      tokens.result?.map((token) => ({
        token: token.token,
        id: token.token,
        notes: token.comment,
        expiredAt: token.expired_at
          ? new Date(token.expired_at).toLocaleString()
          : 'Perpetual',
        valid: token.is_valid,
      })),
    [tokens.result]
  );

  return (
    <GridTable
      columns={columnConfigs}
      Actions={Actions}
      data={data}
      loading={tokens.status === 'loading'}
      emptyHeader="No token"
      emptyContent="Creating new token and manage them."
    />
  );
};
