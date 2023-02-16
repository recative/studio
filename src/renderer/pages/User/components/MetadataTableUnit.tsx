import * as React from 'react';

import { useStyletron } from 'baseui';
import { StyledBodyCell } from 'baseui/table-grid';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import type { IStorage } from 'rpc/query';

import { StorageKey } from './StorageKey';

const bodyStyle = {
  display: 'contents',
} as const;

export interface IMetadataTableUnitProps {
  storage: IStorage;
  onRefreshEpisodeListRequest: () => void;
}

export const MetadataTableUnit: React.FC<IMetadataTableUnitProps> = ({
  storage,
}) => {
  const [css, theme] = useStyletron();

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
        display: 'flex',
      } as const),
    [theme, css]
  );

  return (
    <RecativeBlock key={storage.key} className={css(bodyStyle)} role="row">
      <StyledBodyCell className={cellStyle}>
        <RecativeBlock marginRight="4px">
          <StorageKey id={storage.key} comment={storage.comment} />
        </RecativeBlock>
      </StyledBodyCell>
      <StyledBodyCell className={cellStyle}>
        {`${storage.need_permission_count}/${
          storage.need_permissions?.length ?? 0
        }`}
      </StyledBodyCell>
    </RecativeBlock>
  );
};
