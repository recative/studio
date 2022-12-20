import * as React from 'react';
import cn from 'classnames';

import { useAsync } from '@react-hookz/web';

import { useStyletron } from 'baseui';
import { StyledTable, StyledHeadCell, StyledBodyCell } from 'baseui/table-grid';

import { EmptySpace } from 'components/EmptyState/EmptyState';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';

export interface IPermissionListActionsProps {
  id: string;
}

export interface IPermissionListProps {
  Actions?: React.FC<IPermissionListActionsProps>;
}

const tableStyle = {
  overflowX: 'initial',
  overflowY: 'initial',
} as const;

const headerStyle = {
  top: '300px',
  display: 'contents',
  position: 'sticky',
} as const;

const bodyStyle = {
  display: 'contents',
} as const;

const DEFAULT_ACTIONS = () => <></>;

export const PermissionList: React.FC<IPermissionListProps> = ({
  Actions = DEFAULT_ACTIONS,
}) => {
  const [css, theme] = useStyletron();

  const [permissions, permissionsActions] = useAsync(() => {
    return server.getPermissions();
  });

  React.useEffect(() => {
    permissionsActions.execute();
  }, [permissionsActions]);

  const cellStyle = React.useMemo(
    () =>
      css({
        height: '40px',
        borderBottomColor: theme.colors.borderTransparent || 'black',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        lineHeight: '40px !important',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      } as const),
    [css, theme.colors.borderTransparent]
  );

  const gridHeaderStyle = React.useMemo(
    () =>
      css({
        height: '20px',
        textTransform: 'capitalize',
      }),
    [css]
  );

  const gridTemplateRowStyles = React.useMemo(
    () =>
      css({
        gridTemplateRows: `repeat(${
          permissions.result?.length ?? -1 + 1
        }, min-content)`,
      }),
    [css, permissions.result?.length]
  );

  return (
    <StyledTable
      role="grid"
      className={cn(css(tableStyle), gridTemplateRowStyles)}
      $gridTemplateColumns="max-content auto max-content"
    >
      <RecativeBlock id="checker" className={css(headerStyle)} role="row">
        <StyledHeadCell className={gridHeaderStyle}>ID</StyledHeadCell>
        <StyledHeadCell className={gridHeaderStyle}>Notes</StyledHeadCell>
        <StyledHeadCell className={gridHeaderStyle}></StyledHeadCell>
      </RecativeBlock>
      {permissions.result?.map((permission) => {
        return (
          <RecativeBlock
            key={permission.id}
            className={css(bodyStyle)}
            role="row"
          >
            <StyledBodyCell className={cellStyle}>
              <RecativeBlock fontWeight={500}>{permission.id}</RecativeBlock>
            </StyledBodyCell>
            <StyledBodyCell className={cellStyle}>
              {permission.comment}
            </StyledBodyCell>
            {Actions && (
              <StyledBodyCell className={cellStyle}>
                <Actions id={permission.id} />
              </StyledBodyCell>
            )}
          </RecativeBlock>
        );
      })}
      {!permissions.result?.length && (
        <RecativeBlock gridColumn="1 / 4">
          <EmptySpace
            title="No permission"
            content="Creating new permission entries by synchronizing the episode list or manually adding one."
          />
        </RecativeBlock>
      )}
    </StyledTable>
  );
};
