import * as React from 'react';
import cn from 'classnames';

import { useStyletron } from 'baseui';
import { StyledTable, StyledHeadCell } from 'baseui/table-grid';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { floatDownAnimationStyle } from 'styles/animation';
import type { IStorage } from 'rpc/query';

import { MetadataTableUnit } from './MetadataTableUnit';

const tableStyle = {
  overflowX: 'initial',
  overflowY: 'initial',
} as const;

const headerStyle = {
  top: '300px',
  display: 'contents',
  position: 'sticky',
} as const;

interface IAssetsProps {
  storages: IStorage[];
  onRefreshEpisodeListRequest: () => void;
}

export const MetadataTable: React.FC<IAssetsProps> = ({
  storages,
  onRefreshEpisodeListRequest,
}) => {
  const [css, theme] = useStyletron();

  const additionalTableStyle = React.useMemo(
    () =>
      css({
        height: 'min-content !important',
      }),
    [css]
  );

  const gridTemplateRowStyles = React.useMemo(
    () =>
      css({
        gridTemplateRows: `repeat(${storages?.length ?? 0 + 1}, min-content)`,
      }),
    [css, storages?.length]
  );

  return (
    <RecativeBlock
      paddingLeft="20px"
      paddingRight="20px"
      paddingBottom="20px"
      gridColumn="span 2"
      background={theme.colors.backgroundSecondary}
    >
      <StyledTable
        role="grid"
        className={cn(
          css(tableStyle),
          css(floatDownAnimationStyle),
          additionalTableStyle,
          gridTemplateRowStyles
        )}
        $gridTemplateColumns="min-content auto"
      >
        <RecativeBlock id="checker" className={css(headerStyle)} role="row">
          <StyledHeadCell $sticky={false}>Label</StyledHeadCell>
          <StyledHeadCell $sticky={false}>Permissions</StyledHeadCell>
        </RecativeBlock>

        {storages.filter(Boolean).map((storage) => (
          <MetadataTableUnit
            key={storage.key}
            storage={storage}
            onRefreshEpisodeListRequest={onRefreshEpisodeListRequest}
          />
        ))}
      </StyledTable>
    </RecativeBlock>
  );
};
